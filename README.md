Download video and subtitles from YT:
yt-dlp -a urls_to_download.txt --sub-langs SV --write-subs --convert-subs srt --audio-format mp3 -x -o "%(uploader)s/%(title)s.%(ext)s" -o "subtitle:%(uploader)s/%(title)s.%(ext)s"

Python:
p = pathlib.Path("/Users/satyendra.kumar/Documents/Swedish_Media/Swedish_YT_9")
    for it in p.rglob("*.sv.srt"):
        new_name = f"{it}".replace('.sv.srt', '.srt')
        print(it, new_name)
        os.rename(f"{it}", f"{new_name}")
