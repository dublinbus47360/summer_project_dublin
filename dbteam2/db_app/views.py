from django.shortcuts import render

# Create your views here.
def main_page(request):

    import sys
    import pymysql
    import json

    host='127.0.0.1'
    user = 'root'
    password = 'A0206304131z'
    db = 'db_data'

    try:
        con = pymysql.connect(host=host,user=user,password=password,db=db, use_unicode=True, charset='utf8')
    except Exception as e:
        sys.exit(e)

    cur = con.cursor()
    cur.execute("select stop_lat, stop_lon, stopid_updated, stop_name from db_data.stops_updated where stop_name='Belfield, University College Dublin' or stop_name='Trinity College';")
    data = cur.fetchall()

    return render(request, 'db_app/main_page.html', {'data': json.dumps(data)})
