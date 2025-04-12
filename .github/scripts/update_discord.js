// update_discord.js - Script để cập nhật thông tin Discord trong README.md
const fs = require('fs');
const path = require('path');
// Sử dụng node-fetch v2 để tương thích với môi trường GitHub Actions
const fetch = require('node-fetch');

// Thông tin API
const DISCORD_ID = "920508073423028274";
const API_BASE = "https://api.sangnguyen07.io.vn";
const API_ENDPOINT = "/api/service/discord";

// Badge map cho Discord
const discordBadges = {
  "HypeSquadOnlineHouse1": "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png", // Bravery
  "HypeSquadOnlineHouse2": "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png", // Brilliance
  "HypeSquadOnlineHouse3": "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png", // Balance
  "ActiveDeveloper": "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png"
};

// Fetch Discord data từ API sử dụng fetch như đề xuất
async function fetchDiscordData() {
  try {
    console.log("Fetching Discord data...");
    
    const response = await fetch("".concat(API_BASE, API_ENDPOINT), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        discordId: DISCORD_ID
      })
    });
    
    console.log(`Status Code: ${response.status}`);
    
    if (!response.ok) {
      console.error(`Failed with status code: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Discord data:", error);
    return null;
  }
}

// Lấy badge cho trạng thái
function getStatusBadge(status) {
  const statusColors = {
    "online": "green",
    "idle": "yellow", 
    "dnd": "red",
    "offline": "gray"
  };
  
  const statusEmojis = {
    "online": "🟢",
    "idle": "🟡",
    "dnd": "🔴",
    "offline": "⚫"
  };
  
  const color = statusColors[status] || "gray";
  const emoji = statusEmojis[status] || "⚫";
  const statusText = status.toUpperCase();
  
  return `<img src="https://img.shields.io/badge/${emoji}_${statusText}-${color}?style=flat-square" alt="Status">`;
}

// Format hoạt động hiện tại
function formatActivity(activities) {
  if (!activities || activities.length === 0) {
    return "Không có hoạt động";
  }
  
  for (const activity of activities) {
    if (activity.type === 0) { // Đang chơi game
      const name = activity.name || "";
      const details = activity.details || "";
      const state = activity.state || "";
      
      let activityText = `<b>${name}</b><br>`;
      if (details) {
        activityText += `<i>${details}</i><br>`;
      }
      if (state) {
        activityText += `${state}`;
      }
      
      return activityText;
    }
  }
  
  return "Đang hoạt động";
}

// Xử lý các ký tự đặc biệt trong role name cho URL
function encodeRoleName(name) {
  return encodeURIComponent(name).replace(/-/g, "--").replace(/%/g, "-").replace(/\./g, "-");
}

// Tạo phần Discord cho README
function generateDiscordSection(data) {
  // Lấy thông tin cơ bản
  const username = data.username || "sang0023";
  const displayName = data.displayname || username;
  const avatarUrl = data.avatar || "https://cdn.discordapp.com/embed/avatars/0.png";
  const userId = data.id || DISCORD_ID;
  
  // Lấy trạng thái online
  const status = data.status || "offline";
  
  // Lấy hoạt động hiện tại
  const activities = data.activities || [];
  const activityText = formatActivity(activities);
  
  // Lấy role chính
  const roles = data.roles || [];
  let mainRole = null;
  
  for (const role of roles) {
    if (role.name !== "@everyone" && role.color !== "#000000") {
      mainRole = role;
      break;
    }
  }
  
  // Bắt đầu tạo HTML
  let discordHtml = `### 🎮 Discord 

<div align="center">
  <img src="https://img.shields.io/badge/Discord-${username}-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  <img src="https://discord-readme-badge.vercel.app/api?id=${userId}" alt="Discord Presence" />
</div>

<table align="center">
  <tr>
    <td align="center" width="150px" valign="top">
      <img width="100" height="100" src="${avatarUrl}">
      <br>
      ${getStatusBadge(status)}
    </td>
    <td align="left">
      <h3>${displayName} <code>#${username}</code></h3>`;
      
  if (mainRole) {
    const roleColor = mainRole.color || "#e91e63";
    const roleName = mainRole.name || "OWNER";
    const encodedRoleName = encodeRoleName(roleName);
    const colorHex = roleColor.replace('#', '');
    
    discordHtml += `
      <p>
        <img src="https://img.shields.io/badge/${encodedRoleName}-${colorHex}?style=flat-square" alt="Role">
      </p>`;
  } else {
    discordHtml += `
      <p>
        <img src="https://img.shields.io/badge/OWNER-e91e63?style=flat-square" alt="Role">
      </p>`;
  }
  
  // Xử lý badges
  const badges = data.badges || [];
  if (badges.length > 0) {
    discordHtml += `
      <p>`;
    
    for (const badge of badges) {
      if (discordBadges[badge]) {
        discordHtml += `
        <img src="${discordBadges[badge]}" width="20" height="20" alt="${badge}">`;
      }
    }
    
    discordHtml += `
      </p>`;
  }
  
  discordHtml += `
      <h4>📱 ĐANG HOẠT ĐỘNG</h4>
      <blockquote>
        ${activityText}
      </blockquote>
    </td>
  </tr>
</table>

<!-- Cập nhật vào: ${new Date().toLocaleString('vi-VN')} -->
<!-- Thông tin này được cập nhật tự động từ API: ${API_BASE}${API_ENDPOINT} -->`;

  return discordHtml;
}

// Cập nhật README
async function updateReadme() {
  try {
    const discordData = await fetchDiscordData();
    
    if (!discordData) {
      console.log("No Discord data available. Using static content.");
      return;
    }
    
    console.log("Generating Discord section...");
    const discordSection = generateDiscordSection(discordData);
    
    const readmePath = path.join(process.cwd(), 'README.md');
    
    if (!fs.existsSync(readmePath)) {
      console.error(`README.md not found at ${readmePath}`);
      return;
    }
    
    // Đọc nội dung README hiện tại
    let content = fs.readFileSync(readmePath, 'utf-8');
    
    // Tìm phần Discord hiện tại và thay thế
    const discordPattern = /### 🎮 Discord[\s\S]*?<!-- Thông tin này được cập nhật tự động từ API:.*?-->/;
    
    if (discordPattern.test(content)) {
      // Thay thế phần hiện có
      content = content.replace(discordPattern, discordSection);
    } else {
      // Thêm phần mới phía sau phần "Các Kỹ Năng Khác"
      if (content.includes("---\n\n### 📊 Thống Kê GitHub")) {
        content = content.replace("---\n\n### 📊 Thống Kê GitHub", `---\n\n${discordSection}\n\n---\n\n### 📊 Thống Kê GitHub`);
      } else {
        content = `${content}\n\n${discordSection}`;
      }
    }
    
    // Ghi lại nội dung đã cập nhật
    fs.writeFileSync(readmePath, content, 'utf-8');
    
    console.log("README.md updated with Discord presence");
    
  } catch (error) {
    console.error("Error updating README:", error);
  }
}

// Chạy script
updateReadme(); 