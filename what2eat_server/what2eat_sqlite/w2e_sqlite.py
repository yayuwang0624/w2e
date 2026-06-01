from werkzeug.middleware.proxy_fix import ProxyFix
import os
import sys

sys.path.insert(0, '/usr/local/lib/python3.12/site-packages/sqlite_web/')

from sqlite_web import app
from sqlite_web import initialize_app


def main(db_file):
    initialize_app([db_file], password=os.environ['SQLITE_WEB_PASSWORD'], url_prefix="/w2e_sqlite")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    app.run(host='0.0.0.0', port=4000)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('missing required database file.')
        sys.exit(1)

    main(sys.argv[1])
