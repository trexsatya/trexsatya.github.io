import subprocess

VOCAB_VERSION_TXT = "git-hooks/vocab-version.txt"
VOCAB_FILE = "db/language/swedish/vocabulary.txt"

def get_modified_lines():
    p = subprocess.Popen(f"git diff --unified=0 {VOCAB_FILE}".split(), stdout=subprocess.PIPE)
    return "\n".join(list(map(lambda x: x.decode("utf-8").strip(), p.stdout.readlines())))

def get_original_version():
    p = subprocess.Popen(f"git show  HEAD:{VOCAB_FILE}".split(), stdout=subprocess.PIPE)
    first_line = p.stdout.readlines()[0].decode("utf-8").strip()
    return int(first_line.split("=")[1])

def ensure_new_version(path):
    with open(path) as f:
        first_line = f.readline().strip()
        if first_line.startswith("@version="):
            version = int(first_line.split("=")[1])
            if version <= get_original_version():
                raise Exception(f"You must update the version in {path}")
            print(f"New version found: {version}")

print("Enforcing new version")
p = subprocess.Popen("git diff  origin/gh-pages --name-only --diff-filter=M".split(),
                 stdout=subprocess.PIPE)
for line in p.stdout.readlines():
    file_path = line.decode("utf-8").strip()
    if "/vocabulary" in file_path:
        ensure_new_version(file_path)

retval = p.wait()