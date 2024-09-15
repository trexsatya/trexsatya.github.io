import subprocess

VOCAB_VERSION_TXT = "git-hooks/vocab-version.txt"

def get_existing_version():
    with open(VOCAB_VERSION_TXT) as f:
        return f.readline().strip()

def save_new_version(version):
    with open(VOCAB_VERSION_TXT, "w") as f:
        f.write(version)

def ensure_new_version(path):
    with open(path) as f:
        first_line = f.readline().strip()
        if first_line.startswith("@version="):
            version = first_line.split("=")[1]
            if version <= get_existing_version():
                raise Exception(f"You must update the version in {path}")
            save_new_version(version)
            print(f"New version found: {version}")

print("Enforcing new version")
p = subprocess.Popen("git diff  origin/gh-pages --name-only --diff-filter=M".split(),
                 stdout=subprocess.PIPE)
for line in p.stdout.readlines():
    file_path = line.decode("utf-8").strip()
    if "/vocabulary" in file_path:
        ensure_new_version(file_path)

retval = p.wait()