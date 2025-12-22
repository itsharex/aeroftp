# Flathub Submission Guide for AeroFTP

## Prerequisites

1. **Fork the Flathub repository**: https://github.com/flathub/flathub
2. **Create a new repository** on GitHub: `com.aeroftp.app`

## Files Required

✅ All files are ready in this repository:

- `com.aeroftp.app.yml` - Flatpak manifest
- `com.aeroftp.app.desktop` - Desktop entry file
- `com.aeroftp.app.metainfo.xml` - AppStream metadata
- `icons/AeroFTP_simbol_color_512x512.png` - Application icon

## Submission Steps

### 1. Test Locally (Optional but Recommended)

```bash
# Install flatpak-builder
sudo apt install flatpak-builder

# Add Flathub repository
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Install required runtimes
flatpak install flathub org.freedesktop.Platform//23.08 org.freedesktop.Sdk//23.08

# Build the flatpak
flatpak-builder --force-clean build-dir com.aeroftp.app.yml

# Test the app
flatpak-builder --run build-dir com.aeroftp.app.yml aeroftp
```

### 2. Create Flathub Repository

1. Go to https://github.com/organizations/flathub/repositories/new
2. Name: `com.aeroftp.app`
3. Description: "AeroFTP - Fast, Beautiful, Reliable FTP Client"
4. Make it public

### 3. Push Manifest Files

```bash
# Clone your new flathub repository
git clone https://github.com/flathub/com.aeroftp.app.git
cd com.aeroftp.app

# Copy required files
cp /path/to/FTP_CLIENT_GUI/com.aeroftp.app.yml .
cp /path/to/FTP_CLIENT_GUI/com.aeroftp.app.desktop .
cp /path/to/FTP_CLIENT_GUI/com.aeroftp.app.metainfo.xml .

# Create flathub.json
cat > flathub.json << EOF
{
  "only-arches": ["x86_64"]
}
EOF

# Commit and push
git add .
git commit -m "Initial submission of AeroFTP"
git push origin main
```

### 4. Submit to Flathub

1. Go to: https://github.com/flathub/flathub/issues/new?template=appdata-request.yml
2. Fill in the form:
   - **App ID**: com.aeroftp.app
   - **Repository URL**: https://github.com/flathub/com.aeroftp.app
   - **Additional info**: Link to AeroFTP main repository

### 5. Review Process

- Flathub reviewers will check your manifest
- They may request changes (respond on GitHub)
- Once approved, your app will be published!

## Important Notes

### Before Submission:

1. **Add Screenshots**: Create a `docs/screenshots/` folder in your main repo with screenshots
2. **Update commit hash**: In `com.aeroftp.app.yml`, replace the placeholder commit hash with actual v0.5.6 commit
3. **Test the build**: Make sure it builds successfully locally
4. **Verify metadata**: Check that AppStream metadata is valid

### Get Actual Commit Hash:

```bash
cd /var/www/html/FTP_CLIENT_GUI
git rev-parse v0.5.6
```

### Validate AppStream Metadata:

```bash
appstream-util validate com.aeroftp.app.metainfo.xml
```

## Post-Approval

Once approved:
- Your app will appear on Flathub.org
- Users can install with: `flatpak install flathub com.aeroftp.app`
- Updates are automatic when you push new releases

## Resources

- Flathub Documentation: https://docs.flathub.org/
- Flatpak Documentation: https://docs.flatpak.org/
- AppStream Guidelines: https://www.freedesktop.org/software/appstream/docs/
