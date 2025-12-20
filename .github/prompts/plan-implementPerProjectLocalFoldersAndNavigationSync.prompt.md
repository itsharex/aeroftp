## Plan: Implement Per-Project Local Folders and Navigation Sync

Add ability for developers to set custom local folders per FTP server and optional synchronized navigation between remote/local panels. This enhances workflow by maintaining project-specific contexts and allowing coordinated browsing.

### Steps
1. Update `types.ts` to add `localInitialPath?: string` to `ServerConfig` and sync settings to `AppSettings`.
2. Modify `SavedServers.tsx` to include local path input field in server configuration form.
3. Enhance `App.tsx` connection logic to initialize local panel with saved server path.
4. Add navigation sync toggle in `App.tsx` toolbar with state management.
5. Implement sync logic in navigation functions using path mapping helper.
6. Update `SettingsPanel.tsx` to include global sync navigation option.

### Further Considerations
1. Path mapping strategy: Mirror relative paths vs. follow navigation history?
2. Backward compatibility: Make new fields optional to avoid breaking existing configs.
3. UI feedback: Add visual indicators when panels are synchronized or sync fails.
