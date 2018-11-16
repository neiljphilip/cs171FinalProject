from bs4 import BeautifulSoup
from random import randint
import urllib2
import urllib
import time
import re
import csv

coins = [
    "bitcoin",
    "ethereum",
    "litecoin",
    "ripple",
    "bitcoin-cash",
    "stellar",
    "eos",
    "tether",
    "cardano",
    "monero"
]
cmc_url_1 = "https://coinmarketcap.com/currencies/"
# Apr 28 2013 - Nov 14 2018
cmc_url_2 = "/historical-data/?start=20130428&end=20181114"

columns = ["Date", "Open", "High", "Low", "Close", "Volume", "MarketCap"]

def open_url(coin):
    return BeautifulSoup(urllib2.urlopen(cmc_url_1 + coin + cmc_url_2).read(), "html.parser")

def start():
    for coin in coins:
        with open(coin + ".csv", "wb") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columns)
            writer.writeheader()

            page = open_url(coin)
            days = page.find(id="historical-data").table.tbody.find_all('tr')
            for day in days:
                cols = day.find_all("td")
                day_data = {}
                for i, col in enumerate(cols):
                    day_data[columns[i]] = col.string
                writer.writerow(day_data)
        print("Finished: " + coin)
        time.sleep(10)

start()
