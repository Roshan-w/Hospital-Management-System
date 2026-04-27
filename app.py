from application.__init__ import create_app

app, celery = create_app()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    from flask import render_template
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
