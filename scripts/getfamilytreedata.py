import json
from pprint import pprint

data = None

with open('data.json') as f:
    data = json.load(f)

files = ['10-2008', '04-2011', '08-2011', '09-2011', '10-2011', '01-2012', '02-2012',
'06-2012', '07-2012', '08-2012', '10-2012', '11-2012', '03-2013', '04-2013', '05-2013',
'06-2013', '07-2013', '08-2013', '09-2013', '10-2013', '11-2013', '12-2013', '01-2014',
'02-2014', '03-2014', '04-2014', '05-2014', '06-2014', '07-2014', '08-2014', '09-2014',
'10-2014', '11-2014', '12-2014', '01-2015', '02-2015', '08-2015', '09-2015'];

dataset = {}

## FILTER FOR RUNNING COINS
datacopy = data
idx = None

def hasRunning(idx, key):
    try:
        for child in idx[key]:
            if list(child.values())[0] == 'running':
                return True
    except KeyError:
        return False

def filterNodes(node):
    key = list(node.keys())[0]
    value = list(node.values())[0]
    return value == 'running' or hasRunning(idx, key)

for file in files:
    idx = datacopy[file]
    for key in list(data[file].keys()):
        data[file][key] = list(filter(filterNodes, data[file][key]))

## MERGE NODES
datacopy = data
result = {}

for i, file in enumerate(files):
    if i < 15:
        result[file] = datacopy[file]
    else:
        result[file] = {}
        for key in list(datacopy[file].keys()):
            result[file][key] = []
            incase = []
            leaves = 0
            for node in datacopy[file][key]:
                nodeKey = list(node.keys())[0]
                try:
                    if len(datacopy[file][nodeKey]) > 0:
                        result[file][key].append(node)
                    else:
                        incase.append(node)
                        leaves += 1
                except KeyError:
                    incase.append(node)
                    leaves += 1
            if leaves > 0: #change to 1 to get coin names on last leaf
                countNode = {str(leaves) : incase}
                result[file][key].append(countNode)
            elif leaves == 1:
                result[file][key].append(incase[0])

data = result

def listify(node):
    node["coin"] = list(node.keys())[0]
    node["status"] = node[node["coin"]]
    node["children"] = []
    del node[list(node.keys())[0]]
    return node

def addList(dictIdx, yearData):
    for i, coin in enumerate(dictIdx):
        try:
            if len(masterData[coin["coin"]]) > 0:
                coin["children"] = list(map(listify, masterData[coin["coin"]]))
                dictIdx[i] = coin
                addList(coin["children"], yearData)
        except KeyError:
            pass

for i, file in enumerate(files):
    if i == 0:
        dataset[file] = {"coin" : "BTC", "status" : "running", "children" : []}
    else:
        masterData = data[file]
        dataset[file] = {}
        dictIdx = dataset[file]

        dictIdx["coin"] = "BTC"
        dictIdx["status"] = "running"
        dictIdx["children"] = list(map(listify, masterData["BTC"]))


        dictIdx = addList(dictIdx["children"], masterData)

dataJSON = json.dumps(dataset)
print(dataJSON)
