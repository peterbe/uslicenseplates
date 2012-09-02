import os
from urllib import urlopen
from pyquery import PyQuery as pq
base = 'http://www.theus50.com'
d = pq(url=base + '/licenses-state.php')


def download_page(url):
    D = pq(url=url)
    for img in D('div img'):
        if 'state-licenses' in img.attrib.get('src'):
            d_url = base + img.attrib.get('src')
            destination = os.path.join('plates',
              os.path.basename(d_url).replace('-license',''))
            with open(destination, 'wb') as f:
                f.write(urlopen(d_url).read())
                print destination

for each in d('td a'):
    if each.attrib.get('href','').endswith('license.php'):
        download_page(base + each.attrib.get('href'))
