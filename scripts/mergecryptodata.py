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
columns = ["Coin", "Date", "Open", "High", "Low", "Close", "Volume", "MarketCap"]

def start():
    with open("cryptoFinancialData.csv", "wb") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=columns)
        writer.writeheader()
        for coin in coins:
            with open(coin + ".csv", "rb") as coincsv:
                reader = csv.DictReader(coincsv, fieldnames=columns[1:])
                next(reader, None)
                for row in reader:
                    row["Coin"] = coin
                    writer.writerow(row)
            print("Finished merging: " + coin)

start()
