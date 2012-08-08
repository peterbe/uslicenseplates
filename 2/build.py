#!/usr/bin/env python
import re
import os
import stat
import jsmin
import shutil
import cssmin
from PIL import Image
from lxml import etree
from lxml.cssselect import CSSSelector


def transfer_css_images(dirname, content, destination, destination_rel,
                        domain_prefix=''):
    if not os.path.isdir(destination):
        os.mkdir(destination)
    def replacer(match):
        filename = match.groups()[0]
        if (filename.startswith('"') and filename.endswith('"')) or \
          (filename.startswith("'") and filename.endswith("'")):
            filename = filename[1:-1]
        if 'data:image' in filename or filename.startswith('http://'):
            return filename
        if filename == '.':
            # this is a known IE hack in CSS
            return filename

        full_filename = os.path.normpath(os.path.join(dirname, filename))
        if not os.path.isfile(full_filename):
            return filename
        timestamp = os.stat(full_filename)[stat.ST_MTIME]
        new_filename = os.path.basename(full_filename)
        a, b = os.path.splitext(new_filename)
        new_filename = '%s.%d%s' % (a, timestamp, b)
        new_filename = os.path.join(destination, new_filename)
        shutil.copyfile(full_filename, new_filename)
        new_filename = new_filename.replace(destination, destination_rel)
        new_filename = os.path.normpath(os.path.join(destination, new_filename))
        if domain_prefix:
            new_filename = '%s/%s' % (domain_prefix, new_filename)

        return match.group().replace(filename, new_filename)
    _regex = re.compile('url\(([^\)]+)\)')
    content = _regex.sub(replacer, content)
    return content

def run(domain_prefix=''):

    if domain_prefix:
        if not (domain_prefix.startswith('http') or domain_prefix.startswith('//')):
            domain_prefix = '//' + domain_prefix

    dest = os.path.join(os.path.dirname('dev.html'), 'static', 'build')
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    os.mkdir(dest)

    content = open('dev.html').read()
    stripped = content.strip()
    parser = etree.HTMLParser()
    tree = etree.fromstring(stripped, parser).getroottree()
    page = tree.getroot()
    # lxml inserts a doctype if none exists, so only include it in
    # the root if it was in the original html.
    root = tree if stripped.startswith(tree.docinfo.doctype) else page

    first_css_link = None
    all_css = []
    for link in CSSSelector('link')(page):
        url = link.attrib.get('href')
        if not url.endswith('.css'):
            continue

        timestamp = os.stat(url)[stat.ST_MTIME]
        content = open(url).read()
        content = transfer_css_images(
            os.path.dirname(url),
            content,
            os.path.join(dest, 'img'),
            '../img',
            domain_prefix,
        )
        if '.min' not in url:
            content = cssmin.cssmin(content, wrap=100)
        all_css.append((
          url,
          content,
          timestamp
        ))
        if first_css_link is None:
            first_css_link = link
        else:
            link.getparent().remove(link)

    #print [x[2] for x in all_css]
    youngest = sorted([x[2] for x in all_css])[0]
    os.mkdir(os.path.join(dest, 'css'))
    new_css_filename = '%s.min.css' % youngest
    new_css_filename = os.path.join(dest, 'css', new_css_filename)
    with open(new_css_filename, 'w') as f:
        for url, content, timestamp in all_css:
            f.write('/* %s */\n' % url)
            f.write(content)
            f.write('\n')
    if domain_prefix:
        new_css_filename = '%s/%s' % (domain_prefix, new_css_filename)
    first_css_link.attrib['href'] = new_css_filename

    first_js_tag = None
    all_js = []
    for script in CSSSelector('script')(page):
        url = script.attrib.get('src')
        if not url:
            continue
        if not url.endswith('.js'):
            continue

        timestamp = os.stat(url)[stat.ST_MTIME]
        content = open(url).read()
        if '.min' not in url:
            content = jsmin.jsmin(content)
        all_js.append((
          url,
          content,
          timestamp
        ))
        if first_js_tag is None:
            first_js_tag = script
        else:
            script.getparent().remove(script)

    youngest = sorted([x[2] for x in all_js])[0]
    os.mkdir(os.path.join(dest, 'js'))
    new_js_filename = '%s.min.js' % youngest
    new_js_filename = os.path.join(dest, 'js', new_js_filename)
    with open(new_js_filename, 'w') as f:
        for url, content, timestamp in all_js:
            f.write('/* %s */\n' % url)
            f.write(content)
            f.write('\n')
    if domain_prefix:
        new_js_filename = '%s/%s' % (domain_prefix, new_js_filename)
    first_js_tag.attrib['src'] = new_js_filename

    ## Apple images

    apple_images_dir = os.path.join(dest, 'apple')
    if not os.path.isdir(apple_images_dir):
        os.mkdir(apple_images_dir)
    apple_images = get_apple_images('static/bar.png', apple_images_dir)

    for link in CSSSelector('link')(page):
        if link.attrib.get('rel') != 'apple-touch-icon-precomposed':
            continue

        sizes = link.attrib.get('sizes')
        if not sizes:
            sizes = (57, 57)  # default
        else:
            sizes = tuple([int(x) for x in sizes.split('x')])
        image_url = apple_images[sizes]
        if domain_prefix:
            image_url = '%s/%s' % (domain_prefix, image_url)
        link.attrib['href'] = image_url

    out = etree.tostring(root, method="html", pretty_print=True)
    #if self.strip_important:
    #    out = _importants.sub('', out)
    open('index.html', 'w').write(out)

def get_apple_images(original, destination):

    sizes = (
      (144, 144),
      (114, 114),
      (72, 72),
      (57, 57),
    )

    def resize(im, requested_size):
        x, y = [float(v) for v in im.size]
        xr, yr = [float(v) for v in requested_size]

        if 1 or 'crop' in opts or 'max' in opts:
            r = max(xr / x, yr / y)
        else:
            r = min(xr / x, yr / y)

        if r < 1.0 or (r > 1.0 and 'upscale' in opts):
            im = im.resize((int(round(x * r)), int(round(y * r))),
                           resample=Image.ANTIALIAS)
        return im

    timestamp = os.stat(original)[stat.ST_MTIME]
    images = {}
    for w, h in sizes:
        a, b = os.path.splitext(original)
        dest = os.path.join(destination, '%d-%dx%d%s' % (timestamp, w, h, b))
        images[(w,h)] = dest
        if os.path.isfile(dest):
            print "ALREADY EXISTS"
            continue
        image = Image.open(original)
        new_image = resize(image, (w, h))
        new_image.save(dest)
    return images

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument(
      "-d",
      "--domain_prefix",
      help="display a square of a given number",
      default="")
    args = parser.parse_args()
    run(domain_prefix=args.domain_prefix)
