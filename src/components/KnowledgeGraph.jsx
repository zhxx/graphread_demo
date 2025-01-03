import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./KnowledgeGraph.module.css";

const KnowledgeGraph = ({
  graphData,
  onNodeSelect,
  selectedNode,
  onQuestionSelect,
}) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });
  const [popup, setPopup] = useState({
    show: false,
    content: "",
    title: "",
    type: "",
  });
  const zoomRef = useRef(null);
  const [questionPopup, setQuestionPopup] = useState({
    show: false,
    questions: [],
    x: 0,
    y: 0,
  });

  // 创建按钮组
  const createNodeButtons = (node, x, y) => {
    const buttons = [
      {
        label: "K",
        type: "keywords",
        title: "关键词",
        color: "#FF7875",
        getContent: (node) =>
          Array.isArray(node.attributes.keywords)
            ? node.attributes.keywords.join("、")
            : node.attributes.keywords || "暂无关键词",
      },
      {
        label: "C",
        type: "cases",
        title: "案例",
        color: "#52C41A",
        getContent: (node) =>
          Array.isArray(node.attributes.cases)
            ? node.attributes.cases.join("\n\n")
            : node.attributes.cases || "暂无案例",
      },
      {
        label: "H",
        type: "highlight",
        title: "金句",
        color: "#1890FF",
        getContent: (node) => node.attributes.highlight || "暂无金句",
      },
    ];

    return buttons.map((btn, index) => ({
      x: x + (node.id.length === 1 ? 55 : 40),
      y: y - 30 + index * 25,
      ...btn,
      onClick: (event) => {
        event.stopPropagation();
        setPopup({
          show: true,
          content: btn.getContent(node),
          title: btn.title,
          type: btn.type,
          x: event.clientX,
          y: event.clientY,
        });
      },
    }));
  };

  useEffect(() => {
    console.log("Graph Data Updated:", graphData);
    if (!graphData?.nodes?.length) {
      console.log("No nodes found in graph data");
      return;
    }

    const container = svgRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 清除现有的图谱并创建新的 SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // 创建缩放行为
    const zoom = d3
      .zoom()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;

    svg.call(zoom);
    svg.on("dblclick.zoom", null);
    svg.on("dblclick", () => {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // 处理连接数据
    const links = graphData.links.map((d) => ({
      source: graphData.nodes.find((node) => node.id === d.source),
      target: graphData.nodes.find((node) => node.id === d.target),
      relation: d.relation,
    }));

    console.log("Processed links:", links);

    // 创建力导向图模拟
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(200)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => (d.id.length === 1 ? 80 : 60))
      );

    // 创建箭头标记
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-10 -10 20 20")
      .attr("refX", 35)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 20)
      .attr("markerHeight", 20)
      .append("path")
      .attr("d", "M-8,-8 L 0,0 L -8,8")
      .attr("fill", "#999");

    // 绘制连接线
    const link = g.append("g").selectAll("g").data(links).join("g");

    link
      .append("line")
      .attr("stroke", "#86868b")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)");

    // 添加关系标签
    link
      .append("text")
      .attr("class", styles.linkLabel)
      .attr("text-anchor", "middle")
      .attr("dy", -8)
      .text((d) => d.relation);

    // 创建节点
    const node = g
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    // 为一级节点添加圆形，为二级节点添加矩形
    node.each(function (d) {
      const nodeGroup = d3.select(this);

      if (d.id.length === 1) {
        // 一级节点使用圆形
        nodeGroup
          .append("circle")
          .attr("r", 45)
          .style("fill", "#ffffff")
          .style("stroke", (d) =>
            d.id === selectedNode?.id ? "#ff4d4f" : "#0066cc"
          )
          .style("stroke-width", (d) => (d.id === selectedNode?.id ? 4 : 3))
          .style("filter", (d) =>
            d.id === selectedNode?.id
              ? "drop-shadow(0 6px 12px rgba(255, 77, 79, 0.2))"
              : "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.15))"
          );
      } else {
        // 二级节点使用矩形
        nodeGroup
          .append("rect")
          .attr("x", -40)
          .attr("y", -30)
          .attr("width", 80)
          .attr("height", 60)
          .attr("rx", 8)
          .style("fill", "#ffffff")
          .style("stroke", (d) =>
            d.id === selectedNode?.id ? "#ff4d4f" : "#0066cc"
          )
          .style("stroke-width", (d) => (d.id === selectedNode?.id ? 3 : 2))
          .style("filter", (d) =>
            d.id === selectedNode?.id
              ? "drop-shadow(0 4px 8px rgba(255, 77, 79, 0.2))"
              : "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
          );
      }

      // 添加文本标签
      nodeGroup
        .append("text")
        .text((d) => d.label)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("dy", "0em")
        .style("fill", "#333")
        .style("font-size", d.id.length === 1 ? "14px" : "12px")
        .style("font-weight", d.id.length === 1 ? "600" : "500")
        .style("pointer-events", "none")
        .style("text-shadow", "0 0 3px white, 0 0 3px white, 0 0 3px white")
        .call(wrap, 70);
    });

    // 添加文本换行函数
    function wrap(text, width) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let word;
        let line = [];
        let lineNumber = 0;
        let tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");

        while ((word = words.pop()) !== undefined) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text
              .append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }

        // 计算文本总高度并调整位置以实现垂直居中
        const textHeight = (lineNumber * lineHeight + 1) * 1.1;
        text.selectAll("tspan").attr("dy", function (d, i) {
          const offset = -textHeight / 2 + i * lineHeight + dy;
          return offset + "em";
        });
      });
    }

    // 修改事件处理
    node
      .on("click", (event, d) => {
        if (onNodeSelect) {
          onNodeSelect(d);

          // 显示问题弹窗
          if (d.attributes.question) {
            setQuestionPopup({
              show: true,
              questions: d.attributes.question,
              x: event.pageX,
              y: event.pageY,
            });
          }
        }
      })
      .on("mouseover", (event, d) => {
        setTooltip({
          show: true,
          content: d.attributes.summary,
          x: event.pageX,
          y: event.pageY,
        });
      })
      .on("mouseout", () => {
        setTooltip({ show: false, content: "", x: 0, y: 0 });
      });

    // 添加节点按钮
    node.each(function (d) {
      const nodeGroup = d3.select(this);
      const buttons = createNodeButtons(d, 0, 0);

      buttons.forEach((btn) => {
        const buttonGroup = nodeGroup
          .append("g")
          .style("cursor", "pointer")
          .on("click", function (event) {
            event.stopPropagation();
            btn.onClick(event);
          })
          .on("mouseover", function (event) {
            event.stopPropagation();
            setTooltip({
              show: true,
              content: btn.getContent(d),
              x: event.pageX,
              y: event.pageY,
            });
          })
          .on("mouseout", function (event) {
            event.stopPropagation();
            setTooltip({ show: false, content: "", x: 0, y: 0 });
          });

        buttonGroup
          .append("circle")
          .attr("class", styles.button)
          .attr("cx", btn.x)
          .attr("cy", btn.y)
          .attr("r", 14)
          .style("fill", "#ffffff")
          .style("stroke", btn.color)
          .style("stroke-width", 2)
          .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))");

        buttonGroup
          .append("text")
          .attr("x", btn.x)
          .attr("y", btn.y)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("pointer-events", "none")
          .text(btn.label);
      });
    });

    // 更新力导向图
    simulation.on("tick", () => {
      link
        .select("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      link
        .select("text")
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // 拖拽函数
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 添加键盘快捷键支持
    const handleKeyPress = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "=" || event.key === "+") {
          svg.transition().duration(300).call(zoom.scaleBy, 1.2);
        } else if (event.key === "-") {
          svg.transition().duration(300).call(zoom.scaleBy, 0.8);
        } else if (event.key === "0") {
          svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      simulation.stop();
    };
  }, [graphData, selectedNode, onNodeSelect]);

  // 计算弹窗位置和方向
  const calculatePopupPosition = () => {
    if (!popup.show) return {};

    const margin = 20; // 与按钮的间距
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = popup.x;
    let y = popup.y;
    let direction = "";

    // 根据点击位置计算最佳显示方向
    const spaceRight = viewportWidth - popup.x;
    const spaceLeft = popup.x;
    // const spaceTop = popup.y;
    const spaceBottom = viewportHeight - popup.y;

    if (spaceRight >= 320) {
      // 弹窗宽度 + margin
      x += margin;
      direction = "Left";
    } else if (spaceLeft >= 320) {
      x -= margin;
      direction = "Right";
    } else if (spaceBottom >= 200) {
      // 估计的弹窗高度
      y += margin;
      direction = "Top";
    } else {
      y -= margin;
      direction = "Bottom";
    }

    return {
      left: x,
      top: y,
      className: `${styles.popup} ${styles[`popup${direction}`]}`,
    };
  };

  // 添加缩放按钮的处理函数
  const handleZoom = (type) => {
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;

    if (!zoom) return;

    switch (type) {
      case "in":
        svg.transition().duration(300).call(zoom.scaleBy, 1.2);
        break;
      case "out":
        svg.transition().duration(300).call(zoom.scaleBy, 0.8);
        break;
      case "reset":
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
        break;
      default:
        break;
    }
  };

  if (!graphData?.nodes?.length) {
    return <div className={styles.loading}>Loading graph data...</div>;
  }

  return (
    <div className={styles.graphContainer}>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: "#FF7875" }}
          ></span>
          <span>K: 关键词</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: "#52C41A" }}
          ></span>
          <span>C: 案例</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: "#1890FF" }}
          ></span>
          <span>H: 金句</span>
        </div>
      </div>
      <svg ref={svgRef}></svg>

      {/* Tooltip for summary */}
      {tooltip.show && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Popup for button clicks */}
      {popup.show && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setPopup({ show: false })}
          />
          <div
            {...calculatePopupPosition()}
            style={{
              left: popup.x,
              top: popup.y,
            }}
          >
            <div className={styles.popupHeader}>
              <h3>{popup.title}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setPopup({ show: false })}
              >
                ×
              </button>
            </div>
            <div className={styles.popupContent}>{popup.content}</div>
          </div>
        </>
      )}

      {/* 问题弹窗 */}
      {questionPopup.show && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setQuestionPopup({ show: false })}
          />
          <div
            className={styles.questionPopup}
            style={{
              left: questionPopup.x + 10,
              top: questionPopup.y + 10,
            }}
          >
            <div className={styles.questionPopupHeader}>
              <h3>探讨问题</h3>
              <button
                className={styles.closeButton}
                onClick={() => setQuestionPopup({ show: false })}
              >
                ×
              </button>
            </div>
            <div className={styles.questionList}>
              {questionPopup.questions.map((question, index) => (
                <button
                  key={index}
                  className={styles.questionButton}
                  onClick={() => {
                    onQuestionSelect(question);
                    setQuestionPopup({ show: false });
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={styles.zoomHint}>
        使用触控板双指缩放或 Cmd +/- 调整大小 • 双击重置视图
      </div>
      <div className={styles.zoomControls}>
        <button className={styles.zoomButton} onClick={() => handleZoom("in")}>
          +
        </button>
        <button className={styles.zoomButton} onClick={() => handleZoom("out")}>
          -
        </button>
        <button
          className={styles.zoomButton}
          onClick={() => handleZoom("reset")}
        >
          ⟲
        </button>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
