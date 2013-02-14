.PHONY: clean

name=gdut-jwgl-helper
extension_src_path=ext
chrome=`which google-chrome`

convert:
	python converter.py ${name}.js

zipit:
	zip ${name}.zip ${extension_src_path}/*

packit:
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
