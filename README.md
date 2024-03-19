# mercusys-auto

Toggle the 2.4 and 5 GHz radios of your Mercusys, headlessly with [Puppeteer](https://pptr.dev/) and [Node](https://nodejs.org/).

The web UI is a nightmare - so is the script. There are very weird parts where I had to brute force the solution.

Toggle both on:
```
node main.js on on
```

Toggle 5 GHz on and 2.4 GHz off:
```
node main.js off on
```

...
