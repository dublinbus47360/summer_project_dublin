from django.shortcuts import render
import json, pymysql, sys, requests
from django.http import HttpResponse

# Create your views here.
def main_page(request):
    ''' First view to be executed, renders the mainpage html'''

    return render(request, 'db_app/main_page.html', {})

def get_busLines(request):
    '''Gets the list of all bus lines and respective headsigns'''

    host='127.0.0.1'
    user = 'root'
    password = 'A0206304131z'
    db = 'db_data'

    try:
        con = pymysql.connect(host=host,user=user,password=password,db=db, use_unicode=True, charset='utf8')
    except Exception as e:
        sys.exit(e)

    cur = con.cursor()
    cur.execute("SELECT distinct bus_line, stop_headsign FROM db_data.stoptimes_filtered order by bus_line;")
    data = cur.fetchall()

    bus_lines = []
    for i in data:
        bus_lines.append(i)
    # print(bus_lines)

    return HttpResponse(json.dumps({'bus_lines': bus_lines}))

def search_route(request):
    ''' Gets the intermediate stops for each option route and sends to frontend'''

    response = json.loads(request.POST['googleRequest'])
    start_time = request.POST['start_time']
    week_day = int(request.POST['weekDay'])
    print('weekday is ' + str(week_day))

    selected_hour = int(start_time[11:13])
    if (selected_hour > 20):
        hourForWeather = 0
        isLate = True
    else:
        for i in range(0,3):
            if ((selected_hour + i) % 3) == 0:
                hourForWeather = selected_hour + i
                isLate = False
                break

    if isLate:
        timeForWeather = ('0' + str(hourForWeather) + ':00:00')[-8:]
        today = start_time[8:10]
        if start_time[5:7] in ['04', '06', '09', '11']:
            if today == '30':
                month = int(start_time[5:7]) + 1
                tomorrow = ('0' + str(month))[-2:] + '-01'
                datetimeForWeather = start_time[:5] + tomorrow + ' ' + timeForWeather
            else:
                tomorrow = int(today)+1
                datetimeForWeather = start_time[:8] + ('0' + str(tomorrow))[-2:] + ' ' + timeForWeather
        elif start_time[5:7] == '02':
            if today == '28':
                tomorrow = '03-01'
                datetimeForWeather = start_time[:5] + tomorrow + ' ' + timeForWeather
            else:
                tomorrow = int(today)+1
                datetimeForWeather = start_time[:8] + ('0' + str(tomorrow))[-2:] + ' ' + timeForWeather
        else:
            if today == '31':
                month = int(start_time[5:7]) + 1
                tomorrow = ('0' + str(month))[-2:] + '-01'
                datetimeForWeather = start_time[:5] + tomorrow + ' ' + timeForWeather
            else:
                tomorrow = int(today)+1
                datetimeForWeather = start_time[:8] + ('0' + str(tomorrow))[-2:] + ' ' + timeForWeather
    else:
        timeForWeather = ('0' + str(hourForWeather) + ':00:00')[-8:]
        datetimeForWeather = start_time[:11] + timeForWeather

    # print(timeForWeather)
    # print(datetimeForWeather)

    openWeatherCall = requests.get('http://api.openweathermap.org/data/2.5/forecast?id=7778677&APPID=a4822db1b5634c2e9e25209d1837cc69&units=metric')

    allForecast = openWeatherCall.json()

    isTimeInvalid = True
    for i in range(len(allForecast['list'])):
        if allForecast['list'][i]['dt_txt'] == datetimeForWeather:
            journey_forecast = str(int(allForecast['list'][i]['main']['temp'])) + '˚ - ' + allForecast['list'][i]['weather'][0]['main']
            # print(journey_forecast)
            isTimeInvalid = False
            break

    if isTimeInvalid:
        return HttpResponse('invalid_time')


    stops_info = [0,0,0,0]

    def get_middle(response, step, option):

        try:
            sql = '''select distinct stop_lat,stop_lon,stops.stop_id,stop_name from db_data.stops, db_data.stoptimes_filtered
            where stops.stop_id = stoptimes_filtered.stop_id and db_data.stoptimes_filtered.bus_line=%s
            and db_data.stoptimes_filtered.stop_headsign=%s and (stop_lat between %s and %s) and (stop_lon between %s and %s)'''

            db = pymysql.connect(host="127.0.0.1",  # your host
                                 user="root",  # username
                                 passwd="A0206304131z",  # password
                                 db="db_data")  # name of the database

            stop_names1 = '%'+ response['routes'][option]['legs'][0]['steps'][step]['transit']['departure_stop']['name'] + '%'
            stop_names2 = '%'+ response['routes'][option]['legs'][0]['steps'][step]['transit']['arrival_stop']['name'] + '%'
            line_selected = response['routes'][option]['legs'][0]['steps'][step]['transit']['line']['short_name']
            headsign_selected = response['routes'][option]['legs'][0]['steps'][step]['transit']['headsign']
            number_stops = response['routes'][option]['legs'][0]['steps'][step]['transit']['num_stops']
            stoplat1 = response['routes'][option]['legs'][0]['steps'][step]['transit']['departure_stop']['location']['lat']
            stoplon1 = response['routes'][option]['legs'][0]['steps'][step]['transit']['departure_stop']['location']['lng']
            stoplat2 = response['routes'][option]['legs'][0]['steps'][step]['transit']['arrival_stop']['location']['lat']
            stoplon2 = response['routes'][option]['legs'][0]['steps'][step]['transit']['arrival_stop']['location']['lng']

            # print('route: ' + line_selected)
            # print(stoplat1, stoplon1, stoplat2, stoplon2)

            cursor = db.cursor()
            cursor.execute(sql, (line_selected, headsign_selected, stoplat1 -0.001, stoplat1 +0.001, stoplon1 -0.001, stoplon1 +0.001))
            start_stop = cursor.fetchall()
            if len(start_stop) == 0:
                cursor.execute(sql, (line_selected, headsign_selected, stoplat1 -0.003, stoplat1 +0.003, stoplon1 -0.003, stoplon1 +0.003))
                start_stop = cursor.fetchall()

            cursor.execute(sql, (line_selected, headsign_selected, stoplat2 -0.001, stoplat2 +0.001, stoplon2 -0.001, stoplon2 +0.001))
            end_stop = cursor.fetchall()
            if len(end_stop) == 0:
                cursor.execute(sql, (line_selected, headsign_selected, stoplat2 -0.003, stoplat2 +0.003, stoplon2 -0.003, stoplon2 +0.003))
                end_stop = cursor.fetchall()

            possible_stops = [start_stop[0], end_stop[0]]
            # print(possible_stops)
            stops_info[0] = int((start_stop[0][2])[-4:])
            stops_info[2] = int((end_stop[0][2])[-4:])

        except Exception as e:
            return 'error: could not find possible stops'


        sql = '''select db_data.stoptimes_filtered.trip_id, db_data.stoptimes_filtered.bus_line, db_data.stoptimes_filtered.stop_sequence, db_data.stoptimes_filtered.stop_headsign
        from db_data.stoptimes_filtered
        where stoptimes_filtered.stop_headsign=%s and stoptimes_filtered.bus_line=%s and (stop_id=%s or stop_id=%s)'''

        cursor = db.cursor()
        cursor.execute(sql, (headsign_selected,line_selected,start_stop[0][2],end_stop[0][2]))
        startend_stops = cursor.fetchall()

        # print(startend_stops)

        if len(startend_stops) == 2:
            startend_sequence = [startend_stops[0][0], min(startend_stops[0][2], startend_stops[1][2]), max(startend_stops[0][2], startend_stops[1][2])]
        else:
            for i in range(1,len(startend_stops)):
                if (startend_stops[0][0] == startend_stops[i][0]) and (max(startend_stops[0][2], startend_stops[i][2]) - min(startend_stops[0][2], startend_stops[i][2]) == number_stops):
                    startend_sequence = [startend_stops[0][0], min(startend_stops[0][2], startend_stops[i][2]), max(startend_stops[0][2], startend_stops[i][2])]
                    break
                else:
                    return 'error: startend stops doesnt match'

        # print(startend_sequence)
        stops_info[1] = startend_sequence[1]
        stops_info[3] = startend_sequence[2]
        # print(stops_info)

        sql = '''select stops.stop_id, stop_sequence, stop_headsign, bus_line, stop_lat, stop_lon, stop_name
                from db_data.stoptimes_filtered, db_data.stops
                where stops.stop_id = stoptimes_filtered.stop_id and stoptimes_filtered.stop_headsign =%s
                and stoptimes_filtered.bus_line = %s and trip_id =%s and stop_sequence between %s and %s
                order by stop_sequence'''

        cursor = db.cursor()
        cursor.execute(sql, (headsign_selected,line_selected,startend_sequence[0],startend_sequence[1]+1,startend_sequence[2]-1))
        result = cursor.fetchall()
        db.close()

        # for i in result:
        #     print(i)

        return result

    # Calling the model
    import pickle, os
    script_directory = os.path.dirname(__file__)
    pickle_directory = 'static/db_app/pickle/'

    middle_stops = []
    pickle_list = ['150', '42', '130', '120', '46A', '14', '54A', '16', '66', '37', '15A', '4', '145', '68A', '49', '40', '70', '38A', '83', '27', '66B', '79', '122', '40D', '9', '11', '140', '1', '47', '38', '25B', '15', '29A', '66A', '65', '7', '39A', '41', '15B', '77A', '83A', '27B', '25A', '40B', '151', '123', '32', '43', '27X', '84', '79A', '44', '39', '33X', '14C', '84A', '27A', '65B', '41C', '31A', '31', '13', '69', '7A', '40E', '25', '53', '61', '68', '26', '56A', '7D', '67', '33', '66X', '38B', '67X', '116', '16C', '44B', '38D', '31B', '41B', '25D', '32X', '51D', '16D', '46E', '84X', '7B', '69X', '15D', '41X', '142', '68X', '25X', '39X', '41D', '51X', '77X', '118', '33E']
    prediction_list = []

    def run_pickle(line, inputs):
        pickle_path = os.path.join(script_directory, pickle_directory + line + '.pickle')
        random_forest = pickle.load(open(pickle_path,'rb'))
        try:
            prediction = random_forest.predict(inputs)
        except:
            inputs[0].pop()
            inputs[0].pop(3)
            prediction = random_forest.predict(inputs)
        # print(prediction)
        hour_predicted = int(prediction[0] // 3600)
        min_predicted = int((prediction[0] % 3600) // 60)
        time_predicted = ('0' + str(hour_predicted))[-2:] + ':' + ('0' + str(min_predicted))[-2:]
        return time_predicted

    for k in range(0, len(response['routes'])):
        middle_stops.append([])
        prediction_list.append([])
        haveData = True
        for i in range(0, len(response['routes'][k]['legs'][0]['steps'])):
            if response['routes'][k]['legs'][0]['steps'][i]['travel_mode'] == 'TRANSIT':
                line = response['routes'][k]['legs'][0]['steps'][i]['transit']['line']['short_name']
                if line not in pickle_list:
                    haveData = False
                    # print('no model for line ' + line)
                    break

        for i in range(0, len(response['routes'][k]['legs'][0]['steps'])):
            if response['routes'][k]['legs'][0]['steps'][i]['travel_mode'] == 'TRANSIT':
                try:
                    middle_stops[k].append(get_middle(response, i, k))
                except:
                    middle_stops[k].append('error: could not find intermediate stops for this route')
                this_step = response['routes'][k]['legs'][0]['steps'][i]
                line = this_step['transit']['line']['short_name']
                if (haveData == True):
                    # print('we have data for ' + line)
                    dep_time = this_step['transit']['departure_time']['text']
                    arr_time = this_step['transit']['arrival_time']['text']
                    dep_time = (int(dep_time[0:2]) * 3600) + (int(dep_time[-2:]) * 60)
                    arr_time = (int(arr_time[0:2]) * 3600) + (int(arr_time[-2:]) * 60)
                    model_request = [[0,0,0,0,0,0,0]]
                    model_request[0][week_day] = 1
                    model_request[0].insert(0, dep_time)
                    model_request[0].insert(0, stops_info[0])
                    model_request[0].insert(0, stops_info[1])
                    # print(model_request)
                    prediction_list[k].append(run_pickle(line, model_request))
                    model_request = [[0,0,0,0,0,0,0]]
                    model_request[0][week_day] = 1
                    model_request[0].insert(0, arr_time)
                    model_request[0].insert(0, stops_info[2])
                    model_request[0].insert(0, stops_info[3])
                    # print(model_request)
                    prediction_list[k].append(run_pickle(line, model_request))

    # print(prediction_list)
    # return HttpResponse(json.dumps({'googleRequest':response, 'middle_stops':middle_stops}))
    return HttpResponse(json.dumps({'middle_stops':middle_stops, 'journey_forecast':journey_forecast, 'prediction_list':prediction_list}))


def show_route(request):
    ''' Get all stops of a given bus line for a specific headsign and sends back to frontend'''

    bus_line = request.POST['bus_line']
    # print(bus_line)
    input = bus_line.split(' ', 1)
    # print(input)
    input_line = input[0]
    input_headsign = input[1][1:-1]

    host='127.0.0.1'
    user = 'root'
    password = 'A0206304131z'
    db = 'db_data'

    try:
        con = pymysql.connect(host=host,user=user,password=password,db=db, use_unicode=True, charset='utf8')
    except Exception as e:
        sys.exit(e)

    cur = con.cursor()
    cur.execute("SELECT distinct * FROM db_data.stoptimes_filtered, db_data.stops where stops.stop_id = stoptimes_filtered.stop_id and bus_line=%s and stop_headsign=%s", (input_line, input_headsign))
    result = cur.fetchall()

    return HttpResponse(json.dumps({'route_stops':result}))

def get_events(request):

    today = request.POST['today']
    # print(today)
    lastDay = request.POST['lastDay']
    # print(lastDay)

    eventsRequest = requests.get('https://app.ticketmaster.com/discovery/v2/events?apikey=s8Vo7MFmiNpCFn3fPl9Nq4KVG7jZH5pj&locale=*&startDateTime='+today+'T08:00:00Z&endDateTime='+lastDay+'T08:00:00Z&size=20&page=0&sort=date,asc&city=Dublin&countryCode=IE&includeTest=no')

    eventsResponse = eventsRequest.json()

    eventsList = []
    count = 0
    for event in eventsResponse['_embedded']['events']:
        try:
            if event['_embedded']['venues'][0]['name'] != 'The Punchline':
                eventsList.append([event['name'], event['dates']['start']['localDate'], event['dates']['start']['localTime'], event['_embedded']['venues'][0]['name'], event['_embedded']['venues'][0]['location']])
                count += 1
            if count > 11:
                break
        except Exception as e:
            pass

    # print(eventsList)

    return HttpResponse(json.dumps({'eventsResponse':eventsList}))
