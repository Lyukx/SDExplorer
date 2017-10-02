# TODO
1. Multi-thread support
2. Failure fix: BaseLine strange length
3. Bug fix: After ungrouping, move all message elements down (avoid message in object zone)
4. Bug fix: Show active bar in continous message chains

# パクリ先
http://sdedit.sourceforge.net/

# How to lauch ./test/test=file.html
As browser side does not have the permission to access local files, use server to solve the resource problem.

1. Install http-server in node.js (Reccomand global)
```
npm install -g http-server
```

2. Host the test file fold
```
http-server ./fold
```

3. Access the test page through local host `localhost:8080/test_file.html`
