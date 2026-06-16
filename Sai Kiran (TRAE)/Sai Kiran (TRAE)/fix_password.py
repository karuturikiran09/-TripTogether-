import json
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Load users data
with open('data/users.json', 'r') as f:
    users = json.load(f)

# Find and update sy@gmail.com user
for user in users:
    if user['email'] == 'sy@gmail.com':
        # Set password to "123456"
        user['password'] = hash_password('123456')
        print(f"Updated password for {user['email']} to '123456'")
        break

# Save updated users data
with open('data/users.json', 'w') as f:
    json.dump(users, f, indent=2)

print("Password updated successfully!")
print("You can now login with:")
print("Email: sy@gmail.com")
print("Password: 123456")