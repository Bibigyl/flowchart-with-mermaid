const stagesData = stages.data;
const substagesData = substages.data;
const PAGE_SCALE = {
  small: {
    fontSize: "18px",
    scale: 0.7,
  },
  normal: {
    fontSize: "16px",
    scale: 1,
  },
};
// изменить на normall, чтобы увеличить масштаб
// TODO проверка на поддержку zoom
const PAGE = PAGE_SCALE.small;
const theme = {
  theme: "base",
  themeVariables: {
    fontSize: PAGE.fontSize,
    primaryColor: "#fff",
  },
};



const generateStyles = (substagesData) => {
  const style = document.createElement("style");

  let css = substagesData.map((el) => `
    #subgraph${el.id} rect {
      fill: ${el.color}!important; opacity: 0.2;
    }
    #subgraph${el.id} .nodeLabel {
      color: ${el.color};
    }
  `).join("");

  style.innerHTML = css;
  document.body.append(style);
};

const buildDiagramText = (substagesData, stagesData) => {
  const strings = [`%%{init: ${JSON.stringify(theme)}}%%`, "flowchart LR"];

  substagesData.forEach((el) => {
    strings.push(...getSubgraph(stagesData, el));
  });

  const links = [
    `start([" "]) ---> ${stagesData[0].id}`,
    ...getLinks(stagesData),
    `${stagesData[stagesData.length - 1].id} ---> finish([" "])`,
  ];
  strings.push(...links);

  const enter = "\n";
  return strings.join(enter);
};

const getSubgraph = (stagesData, item) => {
  const strings = [`subgraph subgraph${item.id} ["${item.assistance}"]`];

  stagesData
    .filter((el) => el.stage_id === item.id)
    .forEach((el) => {
      let nodeText = `${el.id}("${divideIntoRows(el.point_context)}")`;
      strings.push(nodeText);
    });
  strings.push("end");
  return strings;
};

const getLinks = (stagesData) => {
  const strings = [];

  stagesData.forEach((el) => {
    const links = el.to_sub_stage
      ? el.to_sub_stage.map((linkTo) => `${el.id} ---> ${linkTo.id}`)
      : [];
    strings.push(...links);
  });
  return strings;
};

const divideIntoRows = (str) => {
  const MAX_ROW_LENGTH = 40;
  let lostStr = str;
  let newStr = "";

  while (lostStr.length > MAX_ROW_LENGTH) {
    let pos = lostStr.lastIndexOf(" ", MAX_ROW_LENGTH);
    pos = pos === -1 ? MAX_ROW_LENGTH : pos;
    newStr = newStr + lostStr.slice(0, pos + 1) + "<br>";
    lostStr = lostStr.slice(pos + 1);
  }
  return newStr + lostStr;
};



const handleDocHover = (event) => {
  const node = event.target.closest(".node");
  clearActiveArrows(node);
  if (node !== null) addActiveArrows(node);
};

const handleDocClick = (event) => {
  const node = event.target.closest(".node");
  if (node !== null) {
    node.focus();
    scrollToEl(node);
  }
  clearActiveArrows();
};

const handleDocKeyup = (event) => {
  clearActiveArrows();
  const isFocusOnNode = document.activeElement.classList.contains("node");
  if (event.key !== "Tab" || !isFocusOnNode) return;
  addActiveArrows(document.activeElement);
  scrollToEl(document.activeElement);   
};

const addActiveArrows = (node) => {
  const parentId = node.getAttribute("id").split("-")[1];
  const arrows = document.querySelectorAll(`path[id*="-${parentId}-"]`);
  for (let arrow of arrows) {
    arrow.classList.add("active-arrow");
    arrow.setAttribute("marker-end", "url(#flowchart-pointEnd-active)");
  }
};

const clearActiveArrows = (hoveredNode = null) => {
  const hoveredNodeId = hoveredNode
    ? hoveredNode.getAttribute("id").split("-")[1]
    : null;
  const focusedNodeId = document.activeElement.classList.contains("node")
    ? document.activeElement.getAttribute("id").split("-")[1]
    : null;

  for (let arrow of document.querySelectorAll(".active-arrow")) {
    const isFromHoveredNode = hoveredNodeId && arrow.id.includes(`-${hoveredNodeId}-`);
    const isFromFocusedNode = focusedNodeId && arrow.id.includes(`-${focusedNodeId}-`);
    if (isFromHoveredNode || isFromFocusedNode) continue;
    arrow.classList.remove("active-arrow");
    arrow.setAttribute("marker-end", "url(#flowchart-pointEnd)");
  }
};

const scrollToEl = el => {
  setTimeout(() => {
    el.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
  }, 0);
};



const renderFlowchart = (substagesData, stagesData) => {
  generateStyles(substagesData);
  document.getElementById("mermaid").textContent = buildDiagramText(substagesData, stagesData);

  const config = {
    startOnLoad: true,
    flowchart: {
      useMaxWidth: false,
    },
    securityLevel: "loose",
  };
  mermaid.initialize(config);
};

const handleFlowchartRendered = () => {
  const nodes = document.querySelectorAll(".node");
  if (nodes.length === 0) return;
  for (let el of nodes) {
    el.setAttribute("tabindex", "0");
  }

  const arrowForwardMarker = document.getElementById("flowchart-pointEnd");
  const cloneMarker = arrowForwardMarker.cloneNode(true);
  cloneMarker.setAttribute("id", "flowchart-pointEnd-active");
  arrowForwardMarker.after(cloneMarker);

  document.addEventListener("mousemove", handleDocHover);
  document.addEventListener("click", handleDocClick);
  document.addEventListener("keyup", handleDocKeyup);

  if (PAGE.scale) document.body.style.zoom = PAGE.scale;
  scrollToEl(document.querySelector('[id*="flowchart-start"]'));

  flowchartRenderedObserver.disconnect();
};



const flowchartRenderedObserver = new MutationObserver(handleFlowchartRendered);
flowchartRenderedObserver.observe(document.getElementById("mermaid"), {
  childList: true
});
renderFlowchart(substagesData, stagesData);



// window.addEventListener("message", event => {
//   // TODO дописать проверку
//   // if (event.origin != 'http://javascript.info') {
//   //   return;
//   // }

//   flowchartRenderedObserver.observe(document.getElementById("mermaid"), {
//     childList: true
//   });
//   const { substages, stages } = event.data
//   renderFlowchart(substages, stages);
// });
