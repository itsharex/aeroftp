//! FTP Storage Provider
//!
//! Implementation of the StorageProvider trait for FTP and FTPS protocols.
//! Uses the suppaftp crate for FTP operations.

use async_trait::async_trait;
use suppaftp::tokio::AsyncFtpStream;
use suppaftp::types::FileType;
use std::io::Cursor;
use tokio::io::AsyncReadExt;

use super::{
    StorageProvider, ProviderError, ProviderType, RemoteEntry, FtpConfig,
};

/// FTP/FTPS Storage Provider
pub struct FtpProvider {
    config: FtpConfig,
    stream: Option<AsyncFtpStream>,
    current_path: String,
}

impl FtpProvider {
    /// Create a new FTP provider with the given configuration
    pub fn new(config: FtpConfig) -> Self {
        Self {
            config,
            stream: None,
            current_path: "/".to_string(),
        }
    }
    
    /// Get mutable reference to the FTP stream, returning error if not connected
    fn stream_mut(&mut self) -> Result<&mut AsyncFtpStream, ProviderError> {
        self.stream.as_mut().ok_or(ProviderError::NotConnected)
    }
    
    /// Parse FTP listing into RemoteEntry
    fn parse_listing(&self, line: &str) -> Option<RemoteEntry> {
        // Try Unix format first, then DOS format
        self.parse_unix_listing(line)
            .or_else(|| self.parse_dos_listing(line))
    }
    
    /// Parse Unix-style listing (ls -l format)
    fn parse_unix_listing(&self, line: &str) -> Option<RemoteEntry> {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 9 {
            return None;
        }
        
        let permissions = parts[0];
        let is_dir = permissions.starts_with('d');
        let is_symlink = permissions.starts_with('l');
        
        // Get size (might be in different position depending on format)
        let size: u64 = parts[4].parse().unwrap_or(0);
        
        // Name is everything after the 8th part (to handle spaces in names)
        let name = parts[8..].join(" ");
        
        // Handle symlinks (name -> target)
        let (actual_name, link_target) = if is_symlink && name.contains(" -> ") {
            let parts: Vec<&str> = name.splitn(2, " -> ").collect();
            (parts[0].to_string(), Some(parts.get(1).unwrap_or(&"").to_string()))
        } else {
            (name, None)
        };
        
        // Skip . and .. entries
        if actual_name == "." || actual_name == ".." {
            return None;
        }
        
        let path = if self.current_path.ends_with('/') {
            format!("{}{}", self.current_path, actual_name)
        } else {
            format!("{}/{}", self.current_path, actual_name)
        };
        
        // Parse date (parts[5..8] typically contain month day time/year)
        let modified = if parts.len() >= 8 {
            Some(format!("{} {} {}", parts[5], parts[6], parts[7]))
        } else {
            None
        };
        
        Some(RemoteEntry {
            name: actual_name,
            path,
            is_dir,
            size,
            modified,
            permissions: Some(permissions.to_string()),
            owner: Some(parts[2].to_string()),
            group: Some(parts[3].to_string()),
            is_symlink,
            link_target,
            mime_type: None,
            metadata: Default::default(),
        })
    }
    
    /// Parse DOS-style listing (Windows FTP servers)
    fn parse_dos_listing(&self, line: &str) -> Option<RemoteEntry> {
        // DOS format: 01-23-24  10:30AM       <DIR>          folder_name
        // Or:         01-23-24  10:30AM           12345      file.txt
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 4 {
            return None;
        }
        
        let is_dir = parts[2] == "<DIR>";
        let size: u64 = if is_dir { 0 } else { parts[2].parse().unwrap_or(0) };
        let name = parts[3..].join(" ");
        
        // Skip . and .. entries
        if name == "." || name == ".." {
            return None;
        }
        
        let path = if self.current_path.ends_with('/') {
            format!("{}{}", self.current_path, name)
        } else {
            format!("{}/{}", self.current_path, name)
        };
        
        let modified = Some(format!("{} {}", parts[0], parts[1]));
        
        Some(RemoteEntry {
            name,
            path,
            is_dir,
            size,
            modified,
            permissions: None,
            owner: None,
            group: None,
            is_symlink: false,
            link_target: None,
            mime_type: None,
            metadata: Default::default(),
        })
    }
}

#[async_trait]
impl StorageProvider for FtpProvider {
    fn provider_type(&self) -> ProviderType {
        if self.config.use_tls {
            ProviderType::Ftps
        } else {
            ProviderType::Ftp
        }
    }
    
    fn display_name(&self) -> String {
        format!("{}@{}", self.config.username, self.config.host)
    }
    
    async fn connect(&mut self) -> Result<(), ProviderError> {
        let addr = format!("{}:{}", self.config.host, self.config.port);
        
        let mut stream = AsyncFtpStream::connect(&addr)
            .await
            .map_err(|e| ProviderError::ConnectionFailed(e.to_string()))?;
        
        // Login
        stream
            .login(&self.config.username, &self.config.password)
            .await
            .map_err(|e| ProviderError::AuthenticationFailed(e.to_string()))?;
        
        // Set binary transfer mode
        stream
            .transfer_type(FileType::Binary)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        // Navigate to initial path if specified
        if let Some(ref initial_path) = self.config.initial_path {
            if !initial_path.is_empty() {
                stream
                    .cwd(initial_path)
                    .await
                    .map_err(|e| ProviderError::InvalidPath(e.to_string()))?;
            }
        }
        
        // Get current directory
        self.current_path = stream
            .pwd()
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        self.stream = Some(stream);
        Ok(())
    }
    
    async fn disconnect(&mut self) -> Result<(), ProviderError> {
        if let Some(mut stream) = self.stream.take() {
            let _ = stream.quit().await;
        }
        Ok(())
    }
    
    fn is_connected(&self) -> bool {
        self.stream.is_some()
    }
    
    async fn list(&mut self, path: &str) -> Result<Vec<RemoteEntry>, ProviderError> {
        let stream = self.stream_mut()?;
        
        let list_path = if path.is_empty() || path == "." {
            None
        } else {
            Some(path)
        };
        
        let lines = stream
            .list(list_path)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        let entries: Vec<RemoteEntry> = lines
            .iter()
            .filter_map(|line| self.parse_listing(line))
            .collect();
        
        Ok(entries)
    }
    
    async fn pwd(&mut self) -> Result<String, ProviderError> {
        let stream = self.stream_mut()?;
        let path = stream
            .pwd()
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        self.current_path = path.clone();
        Ok(path)
    }
    
    async fn cd(&mut self, path: &str) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .cwd(path)
            .await
            .map_err(|e| ProviderError::InvalidPath(e.to_string()))?;
        
        self.current_path = stream
            .pwd()
            .await
            .unwrap_or_else(|_| path.to_string());
        
        Ok(())
    }
    
    async fn cd_up(&mut self) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .cdup()
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        self.current_path = stream
            .pwd()
            .await
            .unwrap_or_else(|_| "/".to_string());
        
        Ok(())
    }
    
    async fn download(
        &mut self,
        remote_path: &str,
        local_path: &str,
        on_progress: Option<Box<dyn Fn(u64, u64) + Send>>,
    ) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        
        // Get file size for progress
        let total_size = stream
            .size(remote_path)
            .await
            .unwrap_or(0) as u64;
        
        // Set binary mode
        stream
            .transfer_type(FileType::Binary)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        // Download using retr_as_stream
        let mut data_stream = stream
            .retr_as_stream(remote_path)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        // Read all data
        let mut data = Vec::new();
        data_stream
            .read_to_end(&mut data)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        // Finalize the stream - need to get stream again after the borrow
        let stream = self.stream.as_mut().ok_or(ProviderError::NotConnected)?;
        stream
            .finalize_retr_stream(data_stream)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        if let Some(progress) = on_progress {
            progress(data.len() as u64, total_size);
        }
        
        // Write to local file
        tokio::fs::write(local_path, &data)
            .await
            .map_err(|e| ProviderError::IoError(e))?;
        
        Ok(())
    }
    
    async fn download_to_bytes(&mut self, remote_path: &str) -> Result<Vec<u8>, ProviderError> {
        let stream = self.stream_mut()?;
        
        // Set binary mode
        stream
            .transfer_type(FileType::Binary)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        // Download using retr_as_stream
        let mut data_stream = stream
            .retr_as_stream(remote_path)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        let mut data = Vec::new();
        data_stream
            .read_to_end(&mut data)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        // Finalize the stream
        let stream = self.stream.as_mut().ok_or(ProviderError::NotConnected)?;
        stream
            .finalize_retr_stream(data_stream)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        Ok(data)
    }
    
    async fn upload(
        &mut self,
        local_path: &str,
        remote_path: &str,
        on_progress: Option<Box<dyn Fn(u64, u64) + Send>>,
    ) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        
        // Read local file
        let data = tokio::fs::read(local_path)
            .await
            .map_err(|e| ProviderError::IoError(e))?;
        
        let total_size = data.len() as u64;
        
        // Upload
        let mut cursor = Cursor::new(data);
        stream
            .put_file(remote_path, &mut cursor)
            .await
            .map_err(|e| ProviderError::TransferFailed(e.to_string()))?;
        
        if let Some(progress) = on_progress {
            progress(total_size, total_size);
        }
        
        Ok(())
    }
    
    async fn mkdir(&mut self, path: &str) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .mkdir(path)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(())
    }
    
    async fn delete(&mut self, path: &str) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .rm(path)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(())
    }
    
    async fn rmdir(&mut self, path: &str) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .rmdir(path)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(())
    }
    
    async fn rmdir_recursive(&mut self, path: &str) -> Result<(), ProviderError> {
        // Get list of contents
        let entries = self.list(path).await?;
        
        // Delete contents first
        for entry in entries {
            if entry.is_dir {
                // Use Box::pin for recursive async call
                Box::pin(self.rmdir_recursive(&entry.path)).await?;
            } else {
                self.delete(&entry.path).await?;
            }
        }
        
        // Now delete the empty directory
        self.rmdir(path).await
    }
    
    async fn rename(&mut self, from: &str, to: &str) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .rename(from, to)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(())
    }
    
    async fn stat(&mut self, path: &str) -> Result<RemoteEntry, ProviderError> {
        // FTP doesn't have a direct stat command, so we list parent and find the entry
        let parent = std::path::Path::new(path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| "/".to_string());
        
        let name = std::path::Path::new(path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .ok_or_else(|| ProviderError::InvalidPath(path.to_string()))?;
        
        let entries = self.list(&parent).await?;
        
        entries
            .into_iter()
            .find(|e| e.name == name)
            .ok_or_else(|| ProviderError::NotFound(path.to_string()))
    }
    
    async fn size(&mut self, path: &str) -> Result<u64, ProviderError> {
        let stream = self.stream_mut()?;
        let size = stream
            .size(path)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(size as u64)
    }
    
    async fn exists(&mut self, path: &str) -> Result<bool, ProviderError> {
        match self.stat(path).await {
            Ok(_) => Ok(true),
            Err(ProviderError::NotFound(_)) => Ok(false),
            Err(e) => Err(e),
        }
    }
    
    async fn keep_alive(&mut self) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        stream
            .noop()
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        Ok(())
    }
    
    async fn server_info(&mut self) -> Result<String, ProviderError> {
        // FTP doesn't have a standard server info command
        // Return basic connection info
        Ok(format!(
            "FTP Server: {}:{}",
            self.config.host, self.config.port
        ))
    }
    
    fn supports_chmod(&self) -> bool {
        true
    }
    
    async fn chmod(&mut self, path: &str, mode: u32) -> Result<(), ProviderError> {
        let stream = self.stream_mut()?;
        
        // SITE CHMOD command
        let chmod_cmd = format!("CHMOD {:o} {}", mode, path);
        stream
            .site(&chmod_cmd)
            .await
            .map_err(|e| ProviderError::ServerError(e.to_string()))?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_unix_listing() {
        let provider = FtpProvider::new(FtpConfig {
            host: "test".to_string(),
            port: 21,
            username: "user".to_string(),
            password: "pass".to_string(),
            use_tls: false,
            initial_path: None,
        });
        
        let line = "drwxr-xr-x    2 user     group        4096 Jan 20 10:00 projects";
        let entry = provider.parse_unix_listing(line).unwrap();
        
        assert_eq!(entry.name, "projects");
        assert!(entry.is_dir);
        assert_eq!(entry.size, 4096);
    }
    
    #[test]
    fn test_parse_dos_listing() {
        let provider = FtpProvider::new(FtpConfig {
            host: "test".to_string(),
            port: 21,
            username: "user".to_string(),
            password: "pass".to_string(),
            use_tls: false,
            initial_path: None,
        });
        
        let line = "01-20-26  10:00AM       <DIR>          Projects";
        let entry = provider.parse_dos_listing(line).unwrap();
        
        assert_eq!(entry.name, "Projects");
        assert!(entry.is_dir);
    }
}
