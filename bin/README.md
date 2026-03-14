# Shenvy CLI

CLI to manage projects, teams, members, and environment variables securely with end-to-end encryption.

## Installation

Shenvy CLI can be installed through several package managers for easy management and updates.

### NPM (Node.js)
The easiest way for web developers to install Shenvy CLI:
```bash
npm install -g @shenvy/cli
```

### Homebrew (macOS & Linux)
Add our official tap and install the formula:
```bash
brew install Shenvy/tap/shenvy
```

### Scoop (Windows)
Add our bucket and install:
```bash
scoop bucket add shenvy https://github.com/Shenvy/shenvy-cli-dist.git
scoop install shenvy
```

### Direct Binary
Download the latest binary for your platform from the [GitHub Releases](https://github.com/Shenvy/shenvy-cli-dist/releases) page and add it to your PATH.

### Build from Source
If you have Go installed, you can build it manually:
```bash
go build -o shenvy.exe
```

## Authentication

### `login`
Log in via browser (Google, GitHub, or email).

```bash
shenvy login
```

### `logout`
Log out of the current session.

```bash
shenvy logout
```

### `user_info`
Display information about the authenticated user.

```bash
shenvy user_info
```

## Project Management

### `init`
Initialize a shenvy repository in the current directory.

```bash
shenvy init
```

### `project list`
List all projects you have access to.

```bash
shenvy project list
```

### `project info [projectId]`
Display details of a project. If no ID is provided, it uses the current project.

```bash
shenvy project info
shenvy project info <projectId>
```

### `project update [projectId]`
Update the name or description of a project.

```bash
shenvy project update --name "New Name" --desc "New description"
shenvy project update <projectId> --name "New Name"
```

### `project delete [projectId]`
Delete a project (soft delete).

```bash
shenvy project delete
shenvy project delete <projectId>
```

### `project restore <projectId>`
Restore a deleted project.

```bash
shenvy project restore <projectId>
```

### `status`
Display the current project status, tracked files, and pending changes.

```bash
shenvy status
```

## Team Management

### `team create <name>`
Create a new team.

```bash
shenvy team create "My Team"
```

### `team info [teamId]`
Display details of a team. Without an ID, it lists all your teams.

```bash
shenvy team info
shenvy team info <teamId>
```

### `team delete <teamId>`
Permanently delete a team.

```bash
shenvy team delete <teamId>
```

### `team transfer <teamId> <newOwnerId>`
Transfer team ownership to another user.

```bash
shenvy team transfer <teamId> <newOwnerId>
```

## Member Management

### `member invite <teamId> <email> [role]`
Invite a user to the team. Roles: `MEMBER` (default), `ADMIN`, `READER`.

```bash
shenvy member invite <teamId> user@example.com
shenvy member invite <teamId> user@example.com ADMIN
```

### `member list <teamId>`
List all members of a team.

```bash
shenvy member list <teamId>
```

### `member update <teamId> <userId> <role>`
Update a member's role.

```bash
shenvy member update <teamId> <userId> ADMIN
```

### `member remove <teamId> <userId>`
Remove a member from the team.

```bash
shenvy member remove <teamId> <userId>
```

## Device Management

### `registerdevice`
Register the current device as a recipient for the project.

```bash
shenvy registerdevice
```

### `unregisterdevice`
Unregister the current device and remove the local identity.

```bash
shenvy unregisterdevice
```

### `device list`
List all devices registered in the current project.

```bash
shenvy device list
```

### `reset`
Reset the device identity.

```bash
shenvy reset
```

## Environment Variable Management

### `add <filename>`
Add a file to track.

```bash
shenvy add .env
shenvy add .env.production
```

### `push`
Encrypt and upload all tracked files.

```bash
shenvy push
```

### `pull`
Download, decrypt, and restore all tracked files.

```bash
shenvy pull
```

### `run`
Execute a command with the environment variables loaded.

```bash
# Load variables from the default environment
shenvy run -- npm start

# Load variables from a specific environment
shenvy run -e development -- npm start
```

### `plan`
Display information about the current subscription plan and its limits.

```bash
shenvy plan
```

### `timeline`
Display the project's change history.

```bash
shenvy timeline
```

### `env delete <envName>`
Delete a variable file (soft delete).

```bash
shenvy env delete .env.production
```

### `env restore <envId>`
Restore a deleted variable file.

```bash
shenvy env restore <envId>
```

### `env versions <envName>`
List all versions of a variable file.

```bash
shenvy env versions .env.production
```

### `env rollback <envName> <version>`
Roll back a file to a specific version.

```bash
shenvy env rollback .env.production 3
```

## Autocomplete

Generate autocomplete scripts for your shell:

### PowerShell
```powershell
shenvy completion powershell | Out-String | Invoke-Expression
```

To make it permanent, add it to your `$PROFILE`:
```powershell
shenvy completion powershell | Out-String | Invoke-Expression
```

### Bash
```bash
shenvy completion bash > /etc/bash_completion.d/shenvy
```

### Zsh
```bash
shenvy completion zsh > "${fpath[1]}/_shenvy"
```

## Typical Workflow

1. **Initialize project**:
   ```bash
   shenvy login
   shenvy init
   ```

2. **Add environment files**:
   ```bash
   shenvy add .env
   shenvy add .env.production
   ```

3. **Register device**:
   ```bash
   shenvy registerdevice
   ```

4. **Encrypt and upload**:
   ```bash
   shenvy push
   ```

5. **Download on another device**:
   ```bash
   shenvy login
   cd <project>
   shenvy registerdevice
   # An admin must run 'shenvy push' to include the new device
   shenvy pull
   ```

## Security Notes

- **Zero Knowledge**: The server never knows your secrets.
- **End-to-End Encryption**: Uses Age (X25519) + ChaCha20-Poly1305.
- **Devices**: Each device has its own key. An admin must re-encrypt to include new devices.
- **Soft Deletes**: Projects and variable files are soft-deleted and can be restored.
