# Inlines data.json into src.html -> index.html (single file, opens without a server)
import pathlib
d=pathlib.Path(__file__).parent
(d/'index.html').write_text((d/'src.html').read_text().replace('__DATA__',(d/'data.json').read_text()))
