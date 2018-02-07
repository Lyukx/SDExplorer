# SDExplorer
**SDExplorer** (Sequence Diagram Explorer) is a flexible and lightweight tool for visualizing program's behavior. We take `traces` as input and draw Sequence Diagrams. We focus on the mission "Exploring large sequence diagrams and digging out the useful information".

## Resources:
- [Homepage](https://lyukx.github.io/SDExplorer/)
- [Playground](https://lyukx.github.io/SDExplorer/playground.html)
- [Wiki](https://github.com/Lyukx/SDExplorer/wiki)
  - [Quick Start](https://github.com/Lyukx/SDExplorer/wiki/Quick-Start)
  - [API Reference](https://github.com/Lyukx/SDExplorer/wiki/API-Reference)

## Requirement
Please import [d3.js](https://d3js.org/) while using **SDExplorer**.

A guaranteed version of d3.js is `3.5.6`. You can simply import it using cdn:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js"></script>
```

## Installation
 - Download `sd.js` or `sd.min.js`.
 - Import it like this:
 ``` html
<script src="{{ js directory }}/sd.js"></script>
<!-- Or use a minimized file to speed up loading -->
<script src="{{ js directory }}/sd.min.js"></script>
 ```

## Compile
Want to build `sd.js` or `sd.min.js` from souce code? Follow these steps:
 - Clone the repository (you can also fork it into your account):
```
git clone https://github.com/Lyukx/SDExplorer
```
 - Make sure you have installed `node.js` and `npm` on your computer. If not, refer to [node.js](https://nodejs.org/en/) and [get-npm](https://www.npmjs.com/get-npm).
 - Install reference
```
npm install
```
 - Run `prepublish` script to compile `sd.js` and `sd.min.js`!
```
npm run prepublish
```
