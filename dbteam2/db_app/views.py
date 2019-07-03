from django.shortcuts import render
import json, pymysql, sys, requests
from django.http import HttpResponse

# Create your views here.
def main_page(request):

    host='127.0.0.1'
    user = 'root'
    password = 'A0206304131z'
    db = 'db_data'

    try:
        con = pymysql.connect(host=host,user=user,password=password,db=db, use_unicode=True, charset='utf8')
    except Exception as e:
        sys.exit(e)

    cur = con.cursor()
    cur.execute("SELECT distinct bus_line FROM db_data.stoptimes_filtered order by bus_line;")
    data = cur.fetchall()

    bus_lines = []
    for i in data:
        bus_lines.append(i[0])
    # print(bus_lines)

    # return render(request, 'db_app/main_page.html', {'data': json.dumps(data)})
    return render(request, 'db_app/main_page_styled.html', {'apikey': 'AIzaSyCM9nXFgqm8JbVlEYRAiPv6WTUFGSvyTBU', 'bus_lines': json.dumps(bus_lines)})

def search_route(request):
    origin = request.POST['origin']
    destination = request.POST['destination']

    googleRequest = requests.get('https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&mode=transit&key=AIzaSyCM9nXFgqm8JbVlEYRAiPv6WTUFGSvyTBU')

    print(googleRequest)

    return HttpResponse(googleRequest)
