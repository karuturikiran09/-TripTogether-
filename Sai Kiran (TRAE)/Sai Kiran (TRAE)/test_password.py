import hashlib

# The stored hash for sy@gmail.com
stored_hash = "4f049ffa489b87d87fbfbbb811d2ca022c6eedb4aef984cb33b3726a21704f0a"

# Common passwords to test
test_passwords = ["123456", "password", "123", "sy", "Sy", "sy123", "test", "admin"]

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

print("Testing passwords for sy@gmail.com:")
print(f"Stored hash: {stored_hash}")
print()

for password in test_passwords:
    generated_hash = hash_password(password)
    match = generated_hash == stored_hash
    print(f"Password: '{password}' -> Hash: {generated_hash} -> Match: {match}")
    if match:
        print(f"*** FOUND MATCH! The password is: '{password}' ***")
        break