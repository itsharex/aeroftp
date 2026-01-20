//! OAuth2 Authentication Module
//!
//! Provides OAuth2 authentication flow for cloud providers like Google Drive,
//! Dropbox, and OneDrive. Uses system browser for authorization and keyring
//! for secure token storage.

use oauth2::{
    basic::BasicClient, AuthUrl, AuthorizationCode, ClientId, ClientSecret,
    CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope,
    TokenResponse, TokenUrl, RefreshToken, 
    reqwest::async_http_client,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use super::ProviderError;

/// OAuth2 provider types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OAuthProvider {
    Google,
    Dropbox,
    OneDrive,
}

impl std::fmt::Display for OAuthProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OAuthProvider::Google => write!(f, "Google Drive"),
            OAuthProvider::Dropbox => write!(f, "Dropbox"),
            OAuthProvider::OneDrive => write!(f, "OneDrive"),
        }
    }
}

/// OAuth2 configuration for a provider
#[derive(Debug, Clone)]
pub struct OAuthConfig {
    pub provider: OAuthProvider,
    pub client_id: String,
    pub client_secret: Option<String>,
    pub auth_url: String,
    pub token_url: String,
    pub scopes: Vec<String>,
    pub redirect_uri: String,
}

impl OAuthConfig {
    /// Create Google Drive OAuth config
    pub fn google(client_id: &str, client_secret: &str) -> Self {
        Self {
            provider: OAuthProvider::Google,
            client_id: client_id.to_string(),
            client_secret: Some(client_secret.to_string()),
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
            token_url: "https://oauth2.googleapis.com/token".to_string(),
            scopes: vec![
                "https://www.googleapis.com/auth/drive".to_string(),
                "https://www.googleapis.com/auth/drive.file".to_string(),
            ],
            redirect_uri: "http://127.0.0.1:17548/callback".to_string(),
        }
    }

    /// Create Dropbox OAuth config
    pub fn dropbox(client_id: &str, client_secret: &str) -> Self {
        Self {
            provider: OAuthProvider::Dropbox,
            client_id: client_id.to_string(),
            client_secret: Some(client_secret.to_string()),
            auth_url: "https://www.dropbox.com/oauth2/authorize".to_string(),
            token_url: "https://api.dropboxapi.com/oauth2/token".to_string(),
            scopes: vec![], // Dropbox uses app permissions, not scopes
            redirect_uri: "http://127.0.0.1:17548/callback".to_string(),
        }
    }

    /// Create OneDrive OAuth config (Microsoft Graph)
    pub fn onedrive(client_id: &str, client_secret: &str) -> Self {
        Self {
            provider: OAuthProvider::OneDrive,
            client_id: client_id.to_string(),
            client_secret: Some(client_secret.to_string()),
            auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize".to_string(),
            token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token".to_string(),
            scopes: vec![
                "Files.ReadWrite".to_string(),
                "Files.ReadWrite.All".to_string(),
                "offline_access".to_string(),
            ],
            redirect_uri: "http://127.0.0.1:17548/callback".to_string(),
        }
    }
}

/// Stored OAuth2 tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>, // Unix timestamp
    pub token_type: String,
    pub scopes: Vec<String>,
}

impl StoredTokens {
    /// Check if token is expired (with 5 min buffer)
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            let now = chrono::Utc::now().timestamp();
            expires_at <= now + 300 // 5 minutes buffer
        } else {
            false // No expiry = assume valid
        }
    }
}

/// OAuth2 Manager for handling authentication flows
pub struct OAuth2Manager {
    /// Pending PKCE verifiers for ongoing auth flows
    pending_verifiers: Arc<RwLock<HashMap<String, PkceCodeVerifier>>>,
    /// Callback server port
    callback_port: u16,
}

impl OAuth2Manager {
    pub fn new() -> Self {
        Self {
            pending_verifiers: Arc::new(RwLock::new(HashMap::new())),
            callback_port: 17548,
        }
    }

    /// Start OAuth2 authorization flow - returns URL to open in browser
    pub async fn start_auth_flow(&self, config: &OAuthConfig) -> Result<(String, String), ProviderError> {
        let client = self.create_client(config)?;
        
        // Generate PKCE challenge
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        
        // Generate state token for CSRF protection
        let (auth_url, csrf_token) = {
            let mut auth_builder = client
                .authorize_url(CsrfToken::new_random)
                .set_pkce_challenge(pkce_challenge);
            
            // Add scopes
            for scope in &config.scopes {
                auth_builder = auth_builder.add_scope(Scope::new(scope.clone()));
            }
            
            auth_builder.url()
        };
        
        let state = csrf_token.secret().clone();
        
        // Store verifier for later
        {
            let mut verifiers = self.pending_verifiers.write().await;
            verifiers.insert(state.clone(), pkce_verifier);
        }
        
        info!("OAuth2 auth URL generated for {:?}", config.provider);
        
        Ok((auth_url.to_string(), state))
    }

    /// Complete OAuth2 flow with authorization code
    pub async fn complete_auth_flow(
        &self,
        config: &OAuthConfig,
        code: &str,
        state: &str,
    ) -> Result<StoredTokens, ProviderError> {
        // Get and remove pending verifier
        let verifier = {
            let mut verifiers = self.pending_verifiers.write().await;
            verifiers.remove(state)
                .ok_or_else(|| ProviderError::AuthenticationFailed(
                    "Invalid state token - authorization flow expired or invalid".to_string()
                ))?
        };
        
        let client = self.create_client(config)?;
        
        // Exchange code for tokens
        let token_result = client
            .exchange_code(AuthorizationCode::new(code.to_string()))
            .set_pkce_verifier(verifier)
            .request_async(async_http_client)
            .await
            .map_err(|e| ProviderError::AuthenticationFailed(format!("Token exchange failed: {}", e)))?;
        
        let expires_at = token_result.expires_in().map(|d| {
            chrono::Utc::now().timestamp() + d.as_secs() as i64
        });
        
        let tokens = StoredTokens {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_at,
            token_type: "Bearer".to_string(),
            scopes: config.scopes.clone(),
        };
        
        // Store in keyring
        self.store_tokens(config.provider, &tokens)?;
        
        info!("OAuth2 tokens obtained for {:?}", config.provider);
        
        Ok(tokens)
    }

    /// Refresh access token using refresh token
    pub async fn refresh_tokens(
        &self,
        config: &OAuthConfig,
        refresh_token: &str,
    ) -> Result<StoredTokens, ProviderError> {
        let client = self.create_client(config)?;
        
        let token_result = client
            .exchange_refresh_token(&RefreshToken::new(refresh_token.to_string()))
            .request_async(async_http_client)
            .await
            .map_err(|e| ProviderError::AuthenticationFailed(format!("Token refresh failed: {}", e)))?;
        
        let expires_at = token_result.expires_in().map(|d| {
            chrono::Utc::now().timestamp() + d.as_secs() as i64
        });
        
        let tokens = StoredTokens {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token()
                .map(|t| t.secret().clone())
                .or_else(|| Some(refresh_token.to_string())), // Keep old refresh token if not returned
            expires_at,
            token_type: "Bearer".to_string(),
            scopes: config.scopes.clone(),
        };
        
        // Update keyring
        self.store_tokens(config.provider, &tokens)?;
        
        info!("OAuth2 tokens refreshed for {:?}", config.provider);
        
        Ok(tokens)
    }

    /// Get valid access token (refreshing if needed)
    pub async fn get_valid_token(
        &self,
        config: &OAuthConfig,
    ) -> Result<String, ProviderError> {
        let mut tokens = self.load_tokens(config.provider)?;
        
        if tokens.is_expired() {
            if let Some(ref refresh_token) = tokens.refresh_token {
                tokens = self.refresh_tokens(config, refresh_token).await?;
            } else {
                return Err(ProviderError::AuthenticationFailed(
                    "Token expired and no refresh token available".to_string()
                ));
            }
        }
        
        Ok(tokens.access_token)
    }

    /// Get the token storage directory
    fn token_dir() -> Result<std::path::PathBuf, ProviderError> {
        let base = dirs::config_dir()
            .ok_or_else(|| ProviderError::Other("Could not find config directory".to_string()))?;
        let token_dir = base.join("aeroftp").join("oauth_tokens");
        if !token_dir.exists() {
            std::fs::create_dir_all(&token_dir)
                .map_err(|e| ProviderError::Other(format!("Failed to create token directory: {}", e)))?;
        }
        Ok(token_dir)
    }

    /// Store tokens in local file (more reliable than keyring on Linux)
    pub fn store_tokens(&self, provider: OAuthProvider, tokens: &StoredTokens) -> Result<(), ProviderError> {
        let token_path = Self::token_dir()?.join(format!("oauth2_{:?}.json", provider).to_lowercase());
        
        let json = serde_json::to_string_pretty(tokens)
            .map_err(|e| ProviderError::Other(format!("Failed to serialize tokens: {}", e)))?;
        
        std::fs::write(&token_path, &json)
            .map_err(|e| ProviderError::Other(format!("Failed to store tokens: {}", e)))?;
        
        // Set restrictive permissions on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let perms = std::fs::Permissions::from_mode(0o600);
            let _ = std::fs::set_permissions(&token_path, perms);
        }
        
        info!("Tokens stored in file for {:?}", provider);
        Ok(())
    }

    /// Load tokens from local file
    pub fn load_tokens(&self, provider: OAuthProvider) -> Result<StoredTokens, ProviderError> {
        let token_path = Self::token_dir()?.join(format!("oauth2_{:?}.json", provider).to_lowercase());
        
        let json = std::fs::read_to_string(&token_path)
            .map_err(|e| ProviderError::AuthenticationFailed(format!("No stored tokens: {}", e)))?;
        
        serde_json::from_str(&json)
            .map_err(|e| ProviderError::Other(format!("Failed to parse tokens: {}", e)))
    }

    /// Delete tokens from file
    pub fn delete_tokens(&self, provider: OAuthProvider) -> Result<(), ProviderError> {
        let token_path = Self::token_dir()?.join(format!("oauth2_{:?}.json", provider).to_lowercase());
        
        if token_path.exists() {
            std::fs::remove_file(&token_path)
                .map_err(|e| ProviderError::Other(format!("Failed to delete tokens: {}", e)))?;
        }
        
        info!("Tokens deleted for {:?}", provider);
        Ok(())
    }

    /// Alias for delete_tokens
    pub fn clear_tokens(&self, provider: OAuthProvider) -> Result<(), ProviderError> {
        self.delete_tokens(provider)
    }

    /// Check if tokens exist for provider
    pub fn has_tokens(&self, provider: OAuthProvider) -> bool {
        self.load_tokens(provider).is_ok()
    }

    /// Create OAuth2 client from config
    fn create_client(&self, config: &OAuthConfig) -> Result<BasicClient, ProviderError> {
        let client_id = ClientId::new(config.client_id.clone());
        let client_secret = config.client_secret.as_ref().map(|s| ClientSecret::new(s.clone()));
        
        let auth_url = AuthUrl::new(config.auth_url.clone())
            .map_err(|e| ProviderError::Other(format!("Invalid auth URL: {}", e)))?;
        
        let token_url = TokenUrl::new(config.token_url.clone())
            .map_err(|e| ProviderError::Other(format!("Invalid token URL: {}", e)))?;
        
        let redirect_url = RedirectUrl::new(config.redirect_uri.clone())
            .map_err(|e| ProviderError::Other(format!("Invalid redirect URL: {}", e)))?;
        
        let mut client = BasicClient::new(client_id, client_secret, auth_url, Some(token_url));
        client = client.set_redirect_uri(redirect_url);
        
        Ok(client)
    }
}

impl Default for OAuth2Manager {
    fn default() -> Self {
        Self::new()
    }
}

/// Simple HTTP server to receive OAuth2 callback
pub async fn start_callback_server(port: u16) -> Result<(String, String), ProviderError> {
    use tokio::net::TcpListener;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    
    let listener: TcpListener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| ProviderError::Other(format!("Failed to start callback server: {}", e)))?;
    
    info!("OAuth callback server listening on port {}", port);
    
    let (mut socket, _): (tokio::net::TcpStream, _) = listener.accept()
        .await
        .map_err(|e| ProviderError::Other(format!("Failed to accept connection: {}", e)))?;
    
    let mut buffer = vec![0u8; 4096];
    let n: usize = socket.read(&mut buffer)
        .await
        .map_err(|e| ProviderError::Other(format!("Failed to read request: {}", e)))?;
    
    let request = String::from_utf8_lossy(&buffer[..n]);
    
    // Parse the request to extract code and state
    let (code, state) = parse_callback_request(&request)?;
    
    // Send success response with proper UTF-8 charset
    let response = "HTTP/1.1 200 OK\r\n\
        Content-Type: text/html; charset=utf-8\r\n\
        Connection: close\r\n\r\n\
        <!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>AeroFTP</title>\
        <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#1a1a2e;color:#fff;}\
        .box{text-align:center;padding:40px;background:#16213e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);}\
        h1{color:#00d4ff;margin-bottom:16px;}p{opacity:0.8;}.icon{font-size:48px;margin-bottom:16px;}</style></head>\
        <body><div class='box'><div class='icon'>&#10004;</div><h1>Authorization Successful</h1>\
        <p>You can close this window and return to AeroFTP.</p></div></body></html>";
    
    let _: () = socket.write_all(response.as_bytes())
        .await
        .map_err(|e| ProviderError::Other(format!("Failed to send response: {}", e)))?;
    
    Ok((code, state))
}

/// Parse OAuth callback request to extract code and state
fn parse_callback_request(request: &str) -> Result<(String, String), ProviderError> {
    // Find the GET line
    let first_line = request.lines().next()
        .ok_or_else(|| ProviderError::AuthenticationFailed("Empty request".to_string()))?;
    
    // Extract path: GET /callback?code=xxx&state=yyy HTTP/1.1
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Err(ProviderError::AuthenticationFailed("Invalid request format".to_string()));
    }
    
    let path = parts[1];
    let query_start = path.find('?')
        .ok_or_else(|| ProviderError::AuthenticationFailed("No query parameters".to_string()))?;
    
    let query = &path[query_start + 1..];
    
    let mut code = None;
    let mut state = None;
    
    for param in query.split('&') {
        let mut kv = param.splitn(2, '=');
        let key = kv.next().unwrap_or("");
        let value = kv.next().unwrap_or("");
        
        match key {
            "code" => code = Some(urlencoding::decode(value).unwrap_or_default().to_string()),
            "state" => state = Some(urlencoding::decode(value).unwrap_or_default().to_string()),
            "error" => return Err(ProviderError::AuthenticationFailed(format!("OAuth error: {}", value))),
            _ => {}
        }
    }
    
    let code = code.ok_or_else(|| ProviderError::AuthenticationFailed("Missing code".to_string()))?;
    let state = state.ok_or_else(|| ProviderError::AuthenticationFailed("Missing state".to_string()))?;
    
    Ok((code, state))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_callback_request() {
        let request = "GET /callback?code=abc123&state=xyz789 HTTP/1.1\r\nHost: localhost\r\n";
        let (code, state) = parse_callback_request(request).unwrap();
        assert_eq!(code, "abc123");
        assert_eq!(state, "xyz789");
    }
    
    #[test]
    fn test_oauth_config_google() {
        let config = OAuthConfig::google("client_id", "client_secret");
        assert_eq!(config.provider, OAuthProvider::Google);
        assert!(config.scopes.len() > 0);
    }
}
