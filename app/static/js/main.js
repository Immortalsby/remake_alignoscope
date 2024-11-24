let ajalist = [];
let keep = 0;
let alibuf = new Array(7058); // 总块数

// 显示对齐文本
async function showAlign(e, id, k) {
    if (keep === 1 && k === 0) return;
    
    const popup = $('#popup');
    popup.style.top = (e.pageY + 30) + 'px';
    popup.style.visibility = 'visible';
    
    // 取消所有正在进行的请求
    ajalist.forEach(controller => controller.abort());
    ajalist = [];
    
    const log = $('#t');
    keep = k;
    
    if (!alibuf[id]) {
        log.innerHTML = '';
        Utils.addClass(log, 'ajax-loading');
        
        const controller = new AbortController();
        ajalist.push(controller);
        
        try {
            // 获取当前的搜索关键词
            const searchForm = $('#search-form');
            const formData = new FormData(searchForm);
            const searchTerms = {
                pos0: formData.get('pos0'),
                neg0: formData.get('neg0'),
                pos1: formData.get('pos1'),
                neg1: formData.get('neg1')
            };
            
            const data = await fetchJSON(`/align/${id}`, {
                signal: controller.signal
            });
            
            // 高亮处理文本
            const highlightedLang0 = highlightText(data.lang0, searchTerms.pos0, searchTerms.neg0);
            const highlightedLang1 = highlightText(data.lang1, searchTerms.pos1, searchTerms.neg1);
            
            log.innerHTML = `
                <table width="100%">
                    <tr>
                        <td colspan="2" class="alipopuptitle" style="padding-top:4px;text-align:center;">
                            ¶ N°${id}
                        </td>
                    </tr>
                    <tr>
                        <td class="alipopuptable" id="popupLang0">${highlightedLang0}</td>
                        <td class="alipopuptable" id="popupLang1">${highlightedLang1}</td>
                    </tr>
                </table>
            `;
            alibuf[id] = log.innerHTML;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error:', error);
            }
        } finally {
            Utils.removeClass(log, 'ajax-loading');
        }
    } else {
        log.innerHTML = alibuf[id];
        Utils.removeClass(log, 'ajax-loading');
    }
}

// 高亮文本中的搜索词
function highlightText(text, posTerms, negTerms) {
    if (!text) return '';
    
    // 处理正向搜索词
    if (posTerms) {
        const terms = posTerms.split(/[\s|]+/).filter(term => term);
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            text = text.replace(regex, '<span class="highlight-positive">$1</span>');
        });
    }
    
    // 处理负向搜索词
    if (negTerms) {
        const terms = negTerms.split(/[\s|]+/).filter(term => term);
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            text = text.replace(regex, '<span class="highlight-negative">$1</span>');
        });
    }
    
    return text;
}

// 隐藏对齐文本
function hideAlign(e) {
    ajalist.forEach(controller => controller.abort());
    if (keep === 0) {
        document.getElementById("popup").style.visibility = 'hidden';
    }
}

// 点击事件处理
function cli(e) {
    const id = e.target.id;
    if (id === "popupLang0" || id === "popupLang1" || id === "t" || id === "c") {
        return;
    }
    keep = 0;
    hideAlign(e);
}

// 搜索功能
async function search(form) {
    const formData = new FormData(form);
    const data = await fetchJSON('/search', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData))
    });
    
    displayResults(data);
}

// 显示搜索结果
function displayResults(data) {
    console.log("Received data:", data);
    
    const resultsDiv = $('#results');
    const totalBlocks = data.total_blocks || 7058;
    const volumes = data.volumes || [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266];
    const stats = data.stats || {};
    
    // 添加统计信息，使用 both_matches 作为 Matches 的值
    let statsHtml = `
        <table style="empty-cells:show; width:100%" cellpadding="1" cellspacing="3">
            <tr>
                <td class="aliresultbox" title="总区块数">
                    Total blocks: ${totalBlocks}
                </td>
                <td class="aliresultbox" title="双向匹配的区块数">
                    Matches: ${stats.both_matches || 0}
                </td>
                <td class="aliresultbox" title="左侧匹配数">
                    Left matches: ${stats.left_matches || 0}
                </td>
                <td class="aliresultbox" title="右侧匹配数">
                    Right matches: ${stats.right_matches || 0}
                </td>
                <td class="aliresultbox" title="正向匹配数">
                    Positive matches: ${stats.positive_matches || 0}
                </td>
                <td class="aliresultbox" title="负向匹配数">
                    Negative matches: ${stats.negative_matches || 0}
                </td>
            </tr>
        </table>
    `;
    
    // 创建匹配结果的映射
    const matchMap = {};
    data.items.forEach(item => {
        matchMap[item.id] = item;
    });
    
    let html = statsHtml + `
        <table style="empty-cells:show; width:100%;" cellpadding="1" cellspacing="3">
        <tbody>
    `;
    
    // 计算每行应该显示多少个方块
    const blocksPerRow = Math.ceil(totalBlocks / volumes.length / 2);
    let currentBlock = 1;
    
    // 遍历每一行
    while (currentBlock <= totalBlocks) {
        html += '<tr>';
        
        // 左列
        html += '<td style="border:3px solid grey;" width="50%">';
        for (let i = 0; i < blocksPerRow && currentBlock <= totalBlocks; i++) {
            const result = matchMap[currentBlock];
            const matchClass = result ? getMatchClass(result) : '';
            console.log(`Block ${currentBlock}:`, result, matchClass); // 打印每个方块的匹配信息
            
            html += `
                <span id="c" 
                      onmouseout="hideAlign(event)" 
                      onmouseover="showAlign(event, ${currentBlock}, 0)" 
                      onclick="showAlign(event, ${currentBlock}, 1)" 
                      class="alisq ${matchClass}">
                </span>
            `;
            currentBlock++;
        }
        html += '</td>';
        
        // 右列
        html += '<td style="border:3px solid grey;" width="50%">';
        for (let i = 0; i < blocksPerRow && currentBlock <= totalBlocks; i++) {
            const result = matchMap[currentBlock];
            const matchClass = result ? getMatchClass(result) : '';
            console.log(`Block ${currentBlock}:`, result, matchClass); // 打印每个方块的匹配信息
            
            html += `
                <span id="c" 
                      onmouseout="hideAlign(event)" 
                      onmouseover="showAlign(event, ${currentBlock}, 0)" 
                      onclick="showAlign(event, ${currentBlock}, 1)" 
                      class="alisq ${matchClass}">
                </span>
            `;
            currentBlock++;
        }
        html += '</td></tr>';
    }
    
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

// 修改匹配类型判断函数
function getMatchClass(item) {
    console.log("Getting match class for:", item); // 打印匹配项信息
    
    if (!item || !item.match_type || item.match_type.length === 0) {
        return '';
    }
    
    const classes = [];
    const types = item.match_type;
    
    if (types.includes('negative')) {
        classes.push('alisqn');
    }
    if (types.includes('positive')) {
        classes.push('alisqp');
    }
    if (types.includes('all')) {
        classes.push('alisqm');
    }
    if (types.includes('left')) {
        classes.push('alisql');
    }
    if (types.includes('right')) {
        classes.push('alisqr');
    }
    
    console.log("Returning classes:", classes.join(' ')); // 打印返回的类名
    return classes.join(' ');
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = $('#search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await search(e.target);
        });
    }
    
    // 添加全局点击事件监听
    document.onclick = cli;
});
