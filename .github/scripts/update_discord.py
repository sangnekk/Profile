import requests
import re
import os

# API URL
API_URL = "https://api.sangnguyen07.io.vn/api/service/discord"

def get_discord_data():
    response = requests.get(API_URL)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching Discord data: {response.status_code}")
        return None

def get_status_badge(status):
    status_colors = {
        "online": "green",
        "idle": "yellow",
        "dnd": "red",
        "offline": "gray"
    }
    color = status_colors.get(status, "gray")
    return f"<img src=\"https://img.shields.io/badge/status-{status}-{color}?style=flat-square\" alt=\"{status.upper()} Status\">"

def get_badges_text(badges):
    badge_names = {
        "HypeSquadOnlineHouse1": "HypeSquad Bravery",
        "HypeSquadOnlineHouse2": "HypeSquad Brilliance",
        "HypeSquadOnlineHouse3": "HypeSquad Balance",
        "ActiveDeveloper": "Active Developer",
        "Nitro": "Nitro",
        "NitroClassic": "Nitro Classic"
    }
    return ", ".join([badge_names.get(badge, badge) for badge in badges])

def format_activity(activity):
    details = activity.get("details", "")
    state = activity.get("state", "")
    
    activity_text = f"<b>Activity:</b> {activity.get('name', '')}<br>"
    if details:
        activity_text += f"<i>{details}</i><br>"
    if state:
        activity_text += f"{state}"
    
    return activity_text

def generate_discord_section(data):
    username = data.get("username", "")
    displayname = data.get("displayname", "")
    avatar = data.get("avatar", "")
    status = data.get("status", "offline")
    badges = data.get("badges", [])
    roles = data.get("roles", [])
    activities = data.get("activities", [])
    
    # Find the highest role (usually the first one with color)
    main_role = None
    for role in roles:
        if role.get("name") != "@everyone" and role.get("color") != "#000000":
            main_role = role
            break
    
    # Get activity if present
    activity_text = ""
    if activities:
        activity_text = format_activity(activities[0])
    
    section = f"""### 🎮 Discord Presence

<div align="center">
  <img src="https://img.shields.io/badge/Discord-{username}-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  <p><b>Status:</b> {get_status_badge(status)}</p>
  
  <table>
    <tr>
      <td rowspan="4">
        <img src="{avatar}" width="100" alt="Discord Avatar">
      </td>
      <td><b>Username:</b> {username} ({displayname})</td>
    </tr>
    <tr>
      <td><b>Badges:</b> {get_badges_text(badges)}</td>
    </tr>"""
    
    if main_role:
        section += f"""
    <tr>
      <td><b>Role:</b> <span style="color:{main_role.get('color')}">{main_role.get('name')}</span></td>
    </tr>"""
    
    section += f"""
    <tr>
      <td>
        {activity_text}
      </td>
    </tr>
  </table>
</div>

<!-- Thông tin này được cập nhật tự động từ API: https://api.sangnguyen07.io.vn/api/service/discord -->"""
    
    return section

def update_readme():
    discord_data = get_discord_data()
    if not discord_data:
        return
    
    discord_section = generate_discord_section(discord_data)
    
    # Read the current README.md
    with open("README.md", "r", encoding="utf-8") as file:
        content = file.read()
    
    # Check if Discord section already exists
    discord_pattern = r"### 🎮 Discord Presence.*?<!-- Thông tin này được cập nhật tự động từ API.*?-->"
    
    if re.search(discord_pattern, content, re.DOTALL):
        # Replace existing section
        updated_content = re.sub(discord_pattern, discord_section, content, flags=re.DOTALL)
    else:
        # Add section before the profile views or at the end
        if "---\n<p align=" in content:
            updated_content = content.replace("---\n<p align=", f"{discord_section}\n\n---\n<p align=")
        else:
            updated_content = f"{content}\n\n{discord_section}"
    
    # Write updated content back to README.md
    with open("README.md", "w", encoding="utf-8") as file:
        file.write(updated_content)
    
    print("README.md updated with Discord presence")

if __name__ == "__main__":
    update_readme()