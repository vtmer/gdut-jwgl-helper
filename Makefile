.PHONY: clean

name=gdut-jwgl-helper
extension_src_path=ext
converter=gm2chrome/converter.py
# get the chrome in your machine
chrome=`ls /usr/bin | grep 'chromium' | head -1`
python=`which python2`


main: packit

convert:
	${python} ${converter} ${name}.js

zipit:
	zip ${name}.zip ${extension_src_path}/*

packit: convert
	if [ -a ${name}.pem ]; \
	then \
	    ${chrome} --pack-extension=${extension_src_path} --pack-extension-key=${name}.pem; \
	else \
	    ${chrome} --pack-extension=${extension_src_path}; \
	    mv -f ${extension_src_path}.pem ${name}.pem; \
	fi;
	mv -f ${extension_src_path}.crx ${name}.crx

clean:
	rm -f *.crx
	rm -f *.zip
