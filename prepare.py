import os
import json

def prepare_search_data():
    names = []
    for subdir, dirs, files in os.walk('db/article'):
        for file in files:
            try:
                p = os.path.join(subdir, file)
                with open(p) as f:
                    d = json.load(f)
                    if d and d['name']:
                        names.append({"name": d['name'], "id": d.get('id', str(file))})
            except Exception as e:
                print("Error", e, file, d)

    with open("db/search", "w") as f:
        f.write(json.dumps(names))	        		

    return names

def prepare_articles_data():
    subjects = {}

    def add_to_subject(subject, d, file):
        items = subjects[subject] if subject in subjects else []
        items.append({
               "name": d['name'], "id": d.get('id', str(file)), "img": d.get("img"),
               "subject": d.get("subject"),
               "summary": d.get("summary"), "lastUpdated": d.get("lastUpdated"),
               "tags": d.get("tags") if d.get("tags") else [],
               "content": ""
            })
        subjects[subject] = items

    for subdir, dirs, files in os.walk('db/article'):
        for file in files:
            try:
                p = os.path.join(subdir, file)
                with open(p) as f:
                    d = json.load(f)
                    if d and 'subject' in d:
                        add_to_subject(d['subject'], d, file)
            except Exception as e:
                print("exception", e, file, d)

    for subject, items in subjects.items():
        with open(f"db/articles/{subject}", "w") as f:
            f.write(json.dumps(items))                  

    return subjects

prepare_search_data()
prepare_articles_data()