# Script to fix dashboard display issues in app.js

# Read the current app.js file
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the showDashboard function
content = content.replace(
    "document.getElementById('dashboardNav').style.display = 'block';\n    document.getElementById('dashboardMain').style.display = 'block';",
    "document.getElementById('dashboard').style.display = 'block';"
)

# Fix the logout function
content = content.replace(
    "document.getElementById('dashboardNav').style.display = 'none';\n    document.getElementById('dashboardMain').style.display = 'none';",
    "document.getElementById('dashboard').style.display = 'none';"
)

# Write the fixed content back to app.js
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed dashboard display issues in app.js")