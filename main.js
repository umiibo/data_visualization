//Data Tools
//把標示為空值的字串("NA")變成JavaScript認知的空值
const parseNA = string => (string == 'NaN' ? undefined : string);
const parseA = string => (string == 'NaN' ? 0 : string);
const parseDate = string => d3.timeParse('%Y/%m/%d')(string);
function type(d){
    const date = parseDate(d.Last_updated);
    const rating= parseA(d.Rating);
    return {
        Download:+d.Download,
        App:parseNA(d.App),
        Category:parseNA(d.Category),
        Rating:+rating,
        Type:parseNA(d.Type),
        Price:+d.Price,
        Genres:parseNA(d.Genres),
        last_updated:d.Last_updated,
        Last_updated:date,
        // Year_updated:date.getFullYear(),
        Reviews:+d.Reviews,
        Size:parseNA(d.Size),
        Current_Ver:parseNA(d. Current_Ver),
        Content_Rating:parseNA(d. Content_Rating),
        Android_Ver:parseNA(d.Android_Ver),
    }
}
function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}
//Data Selection
function filterData(data){
    return data.filter(
        d => {
            return(
                d.App && 
                d.Category &&
                d.Rating<=5  &&
                d.Download &&
                d.Genres && 
                d.Type
            );
        }
    );
}
function prepareScatterData(data){
    return data.sort((a,b)=>a.Rating-b.Rating).filter((d,i)=>i<10000);
}

function setupCanvas(scatterData, appsClean){

    let metric = 'Free';

    function click(){
        metric = this.dataset.name;
        const thisData = chooseData(metric, appsClean);
        update(thisData);
    }

    d3.selectAll('button').on('click',click);

    function update(data){
        // console.log(data);
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);
        xExtent = d3.extent(data, d=>d.Reviews);
        xScale = d3.scaleLinear().domain(xExtent).range([0,chart_width]);
        yExtent = d3.extent(data, d=>d.Rating);
        yScale = d3.scaleLinear().domain(yExtent).range([chart_height,0]);

        header.select('tspan').text(`10000 ${metric} Apps by Rating`);
        

        scatters.selectAll('.scatter').data(data,d=>d.Rating).join(
            enter => {
                // console.log(data);
                enter.append('circle')
                .attr('class','scatter')
                .attr('cx',d=>xScale(d.Reviews))
                .attr('cy',d=>yScale(d.Rating))
                .attr('r',2)
                .style('fill','dodgerblue')
                .style('fill-opacity',0.3)
                .attr('transform',`translate(0,20)`);
            },
            update=>{update
                // console.log(data);
            },
            exit=>{
                exit.remove();
                // console.log(data);
            }
        );

        function brushed(e){
            //debugger;   
            if(e.selection){
                //取得選取的矩形座標
                const [[x0,y0],[x1,y1]] = e.selection;
    
                // console.log(data);
    
                //判斷有哪些資料落在選取範圍中
                const selected = data.filter(
                    d => 
                        x0 <=xScale(d.Reviews) &&xScale(d.Reviews) <x1 &&
                        y0-20 <=yScale(d.Rating) &&yScale(d.Rating) <y1-20
                );
                
                updateSelected(selected);
            }
        }
        
        brush = d3.brush(data).extent([[0,0],[svg_width,svg_height]])
             .on('brush',brushed);
        this_svg.append('g').attr('class','brush').call(brush);
        
    }

    const svg_width = 600;
    const svg_height = 400;
    const chart_margin = {top:80,right:110,bottom:80,left:55};
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    //Draw Scatter Base
    const this_svg = d3.select('.scatter-plot-container').append('svg')
      .attr('width', svg_width).attr('height',svg_height)
      .append('g')
      .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);

    //scale
    //d3.extent find the max & min in Download
    let xExtent = d3.extent(scatterData, d=>d.Reviews);
    let xScale = d3.scaleLinear().domain(xExtent).range([0,chart_width]);
    //垂直空間的分配-平均分布給各種類
    let yExtent = d3.extent(scatterData, d=>d.Rating);
    let yScale = d3.scaleLinear().domain(yExtent).range([chart_height,0]);
    //營收最小的放最下方，與座標

    //Draw Scatters
    // this_svg.selectAll('.scatter').data(scatterData).enter()
    //         .append('circle')
    //         .attr('class','scatter')
    //         .attr('cx',d=>xScale(d.Reviews))
    //         .attr('cy',d=>yScale(d.Rating))
    //         .attr('r',2)
    //         .style('fill','dodgerblue')
    //         .style('fill-opacity',0.3)
    //         .attr('transform',`translate(0,20)`);
            
    const scatters = this_svg.append('g').attr('class','scatter');
    //ticks 決定約略有幾個刻度(依數值狀況)
    //xAxis
    const xAxis = d3.axisBottom(xScale).ticks(12).tickFormat(formatTicks)
                    .tickSizeInner(-chart_height).tickSizeOuter(0);
    
    const xAxisDraw = this_svg.append('g').attr('class','x axis')
                        .attr('transform',`translate(0,${chart_height+20})`)
                        .call(xAxis)
                        .call(addLabel,'Reviews',-20,15);
    //拉開字與軸的距離
    xAxisDraw.selectAll('text').attr('dy','2em');

    //yAxis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
                    .tickSizeInner(-chart_width).tickSizeOuter(0);
    const yAxisDraw = this_svg.append('g').attr('class','y axis')
                        .attr('transform',`translate(0,20)`)
                        .call(yAxis)
                        .call(addLabel,'Rating',-30,-15);
    //拉開字與軸的距離
    yAxisDraw.selectAll('text').attr('dx','-1em');

    //Draw header
    const header = this_svg.append('g').attr('class','bar-header')
                    .attr('transform',`translate(0,${-chart_margin.top/2})`)
                    .append('text');
    header.append('tspan').text('Reviews v.s. Rating by Google Play Store')
    .attr('x',0).attr('y',0).style('font-size','1.5em');
    header.append('tspan').text('10000 Apps by Rating')
    .attr('x',0).attr('y',25).style('font-size','0.8em').style('fill','#555');



    function updateSelected(data){
        d3.select('.selected-body')
          .selectAll('.selected-element')
          .data(data, d=>d.id)
          .join(
            enter => {
                enter.append('p').attr('class','selected-element')
                     .html(
                        d=> `<span class="selected-title">${d.App}</span>,
                        ${d.last_updated}
                         <br>Reviews: ${formatTicks(d.Reviews)}|
                         Rating: ${(d.Rating)}`
                     );
            },
            update => {update},
            exit => {exit.remove();}
            )
    }

    //Add brush
    // let brush = d3.brush().extent([[0,0],[svg_width,svg_height]])
    //             .on('brush',brushed);
    // this_svg.append('g').attr('class','brush').call(brush);

    d3.select('.selected-container')
      .style('width',`${svg_width}px`)
      .style('height',`${svg_height}px`);
    
    update(scatterData);

}

    function addLabel(axis, label, x, y){
        /* axis 是呼叫者-哪一個軸*/
        axis.selectAll('.tick:last-of-type text')
        .clone()
        .text(label)
        .attr('x',x)
        .attr('y',y)
        .style('text-anchor','start')
        .style('font-weight','bold')
        .style('fill','#555');
    }

function chooseData(metric, appClean){
    return appClean.filter(
        d => {
            return(
                d.Type == metric
            );
        }
    );
}



//Main
function ready(apps){
    const appClean = filterData(apps);
    // console.log(appClean);
    const scatterData = prepareScatterData(appClean);
    const freeData = chooseData('Free',scatterData);
    // const scatterData = appClean;
    // console.log(scatterData);
    setupCanvas(freeData, scatterData);
}
d3.csv('data/googleplaystore data.csv',type).then(
    res => {
        // debugger;
        ready(res);
    
    }
);
