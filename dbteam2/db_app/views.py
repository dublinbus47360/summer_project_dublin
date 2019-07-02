from django.shortcuts import render
import json, pymysql, sys, requests
from django.http import HttpResponse

# Create your views here.
def main_page(request):

    # host='127.0.0.1'
    # user = 'root'
    # password = 'A0206304131z'
    # db = 'db_data'
    #
    # try:
    #     con = pymysql.connect(host=host,user=user,password=password,db=db, use_unicode=True, charset='utf8')
    # except Exception as e:
    #     sys.exit(e)
    #
    # cur = con.cursor()
    # cur.execute("select stop_lat, stop_lon, stopid_updated, stop_name from db_data.stops_updated where stop_name='Belfield, University College Dublin' or stop_name='Trinity College';")
    # data = cur.fetchall()
    #
    # return render(request, 'db_app/main_page.html', {'data': json.dumps(data)})
    return render(request, 'db_app/main_page_styled.html', {'apikey': 'AIzaSyCM9nXFgqm8JbVlEYRAiPv6WTUFGSvyTBU'})

def search_route(request):
    origin = request.POST['origin']
    destination = request.POST['destination']

    googleRequest = requests.get('https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&mode=transit&key=AIzaSyCM9nXFgqm8JbVlEYRAiPv6WTUFGSvyTBU')

    print(googleRequest)

    return HttpResponse(googleRequest)
