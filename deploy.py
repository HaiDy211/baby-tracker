import base64, os, json, sys

# Target directory
TARGET = r"C:\Users\30994\Coze\baby-tracker"

# Read the data file
script_dir = os.path.dirname(os.path.abspath(__file__))
data_file = os.path.join(script_dir, "deploy_data.json")

if not os.path.exists(data_file):
    print(f"Error: {data_file} not found!")
    print("Please make sure deploy_data.json is in the same directory as this script.")
    sys.exit(1)

with open(data_file, 'r', encoding='utf-8') as f:
    files = json.load(f)

print(f"Deploying {len(files)} files to {TARGET}...")
print("")

count = 0
errors = []
for rel_path, b64data in files.items():
    full_path = os.path.join(TARGET, rel_path.replace("/", os.sep))
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        raw = base64.b64decode(b64data)
        with open(full_path, "wb") as f:
            f.write(raw)
        count += 1
        print(f"  OK: {rel_path} ({len(raw)} bytes)")
    except Exception as e:
        errors.append(f"{rel_path}: {e}")
        print(f"  FAIL: {rel_path} - {e}")

print("")
print(f"Done! {count}/{len(files)} files written successfully.")
if errors:
    print(f"Errors: {len(errors)}")
    for e in errors:
        print(f"  {e}")
else:
    print("All files deployed successfully!")
    print("")
    print("You can now open this directory in WeChat DevTools to preview the mini program.")
