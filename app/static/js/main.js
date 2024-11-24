// 全局变量
window.ajalist = window.ajalist || [];
window.keep = window.keep || 0;
window.alibuf = window.alibuf || new Array(7058);

// 显示对齐文本
window.showAlign = window.showAlign || async function(e, id, k) {
    if (window.keep === 1 && k === 0) return;
    
    const $popup = $('#popup');
    $popup.css({
        top: (e.pageY + 30) + 'px',
        visibility: 'visible'
    });

    const currentTable = $('#table-select').val();
    
    // 取消所有正在进行的请求
    try {
        window.ajalist.forEach(controller => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        });
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error:', error);
        }
    }
    
    window.ajalist = [];
    const $log = $('#t');
    window.keep = k;
    
    const bindCloseButton = () => {
        $('.popup-close').on('click', function(e) {
            e.stopPropagation();
            window.keep = 0;
            window.hideAlign(e);
        });
    };
    
    if (!window.alibuf[id]) {
        $log.empty().addClass('ajax-loading');
        
        const controller = new AbortController();
        window.ajalist.push(controller);
        
        try {
            const data = await Utils.fetchJSON(`/align/${id}?table=${currentTable}`, {
                signal: controller.signal
            });
            
            if (data) {
                const searchTerms = {
                    pos0: $('#pos0').val(),
                    neg0: $('#neg0').val(),
                    pos1: $('#pos1').val(),
                    neg1: $('#neg1').val()
                };
                
                let { lang0, lang1 } = data;
                
                // 处理法语正向搜索词高亮
                if (searchTerms.pos0) {
                    const terms = searchTerms.pos0.split(/\s+/).filter(term => term);
                    terms.forEach(term => {
                        const subTerms = term.split('|');
                        subTerms.forEach(subTerm => {
                            if (subTerm.trim()) {
                                const regex = new RegExp(`(\\b${subTerm.trim()}\\b)`, 'gi');
                                lang0 = lang0.replace(regex, '<span class="alisqp">$1</span>');
                            }
                        });
                    });
                }
                
                // 处理中文正向搜索词高亮
                if (searchTerms.pos1) {
                    const terms = searchTerms.pos1.split(/\s+/).filter(term => term);
                    terms.forEach(term => {
                        const subTerms = term.split('|');
                        subTerms.forEach(subTerm => {
                            if (subTerm.trim()) {
                                const regex = new RegExp(`(${subTerm.trim()})`, 'gi');
                                lang1 = lang1.replace(regex, '<span class="alisqp">$1</span>');
                            }
                        });
                    });
                }
                
                // 处理负向搜索词高亮
                if (searchTerms.neg0) {
                    const terms = searchTerms.neg0.split(/\s+/).filter(term => term);
                    terms.forEach(term => {
                        const subTerms = term.split('|');
                        subTerms.forEach(subTerm => {
                            if (subTerm.trim()) {
                                const regex = new RegExp(`(\\b${subTerm.trim()}\\b)`, 'gi');
                                lang0 = lang0.replace(regex, '<span class="alisqn">$1</span>');
                            }
                        });
                    });
                }
                
                if (searchTerms.neg1) {
                    const terms = searchTerms.neg1.split(/\s+/).filter(term => term);
                    terms.forEach(term => {
                        const subTerms = term.split('|');
                        subTerms.forEach(subTerm => {
                            if (subTerm.trim()) {
                                const regex = new RegExp(`(${subTerm.trim()})`, 'gi');
                                lang1 = lang1.replace(regex, '<span class="alisqn">$1</span>');
                            }
                        });
                    });
                }
                
                window.alibuf[id] = `
                    <table width="100%">
                        <tr>
                            <td colspan="2" class="alipopuptitle text-center py-2">
                                ¶ N°${id}
                                <span class="popup-close">&times;</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="alipopuptable" id="popupLang0">${lang0}</td>
                            <td class="alipopuptable" id="popupLang1">${lang1}</td>
                        </tr>
                    </table>
                `;
                
                $log.html(window.alibuf[id]);
                bindCloseButton();
            }
        } finally {
            $log.removeClass('ajax-loading');
            const index = window.ajalist.indexOf(controller);
            if (index > -1) {
                window.ajalist.splice(index, 1);
            }
        }
    } else {
        $log.html(window.alibuf[id]);
        bindCloseButton();
    }
};

// 隐藏对齐文本
window.hideAlign = window.hideAlign || function(e) {
    if (window.keep === 0) {
        $('#popup').css('visibility', 'hidden');
    }
};

// 搜索功能
async function search(form) {
    const $results = $('#results');
    $results.empty().addClass('loading');
    
    try {
        const formData = new FormData(form);
        const currentTable = $('#table-select').val();
        
        const searchParams = {
            table: currentTable,
            pos0: formData.get('pos0') || '',
            neg0: formData.get('neg0') || '',
            pos1: formData.get('pos1') || '',
            neg1: formData.get('neg1') || ''
        };
        
        const response = await fetch('/search?' + new URLSearchParams(searchParams));
        const data = await response.json();
        
        if (data.blocks && data.blocks.length > 0) {
            // 显示总数
            $results.html(`
                <div class="total-blocks mb-3">
                    找到 ${data.blocks.length} 个匹配段落
                </div>
                <div class="alisq-grid"></div>
            `);
            
            // 创建小方块
            const $grid = $('.alisq-grid');
            data.blocks.forEach(block => {
                const $block = $('<div>', {
                    class: `alisq ${block.type}`,
                    text: block.id,
                    mouseenter: function(e) {
                        window.showAlign(e, block.id, 0);
                    },
                    mouseleave: function(e) {
                        window.hideAlign(e);
                    },
                    click: function(e) {
                        window.showAlign(e, block.id, 1);
                    }
                });
                
                $grid.append($block);
            });
        } else {
            $results.html('<div class="alert alert-info">没有找到匹配的结果</div>');
        }
    } catch (error) {
        console.error('Search error:', error);
        $results.html('<div class="alert alert-danger">搜索出错，请重试</div>');
    } finally {
        $results.removeClass('loading');
    }
}

// 加载所有表格
async function loadTables() {
    try {
        const response = await fetch('/tables');
        const data = await response.json();
        const $select = $('#table-select');
        
        $select.empty();
        data.tables.forEach(table => {
            $select.append($('<option>', {
                value: table,
                text: table
            }));
        });
    } catch (error) {
        console.error('Failed to load tables:', error);
    }
}

// Howto 和 Presentation 的展开/收起功能
function ouvre(n, h) {
    const $row = $(`#idRow${n}`);
    if ($row.is(':hidden')) {
        $row.slideDown().css('height', h + 'px');
    } else {
        $row.slideUp();
    }
}

function dessus(n) {
    $(`#name${n}`).css('backgroundColor', '#eee');
}

function parti(n) {
    $(`#name${n}`).css('backgroundColor', '');
}

// 初始化
$(document).ready(function() {
    // 加载表格
    loadTables();
    
    // 上传对话框控制
    const $uploadDialog = $('#upload-dialog');
    
    $('#show-upload-btn').on('click', function() {
        $uploadDialog.modal('show');
    });
    
    // 表单提交
    $('#upload-form').on('submit', async function(e) {
        e.preventDefault();
        try {
            const formData = new FormData(this);
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('上传成功！');
                $uploadDialog.modal('hide');
                loadTables();
            } else {
                alert(data.error || '上传失败');
            }
        } catch (error) {
            alert('上传出错：' + error.message);
        }
    });
    
    // 表格选择变化
    $('#table-select').on('change', function() {
        window.alibuf = new Array(7058);
        const $searchForm = $('#search-form');
        if ($searchForm.length) {
            search($searchForm[0]);
        }
    });
    
    // 搜索表单提交
    $('#search-form').on('submit', function(e) {
        e.preventDefault();
        search(this);
    });
    
    // 文档点击事件
    $(document).on('click', function(e) {
        const $target = $(e.target);
        if (!$target.closest('#popupLang0, #popupLang1, #t, #c').length) {
            window.keep = 0;
            window.hideAlign(e);
        }
    });
});


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
window.hideAlign = window.hideAlign || function(e) {
    try {
        window.ajalist.forEach(controller => {
            // 只有当 controller 没有被中止时才中止
            if (!controller.signal.aborted) {
                controller.abort();
            }
        });
    } catch (error) {
        // 忽略 AbortError
        if (error.name !== 'AbortError') {
            console.error('Error:', error);
        }
    }
    
    // 清空请求列表
    window.ajalist = [];
    
    if (window.keep === 0) {
        document.getElementById("popup").style.visibility = 'hidden';
    }
}

// 点击事件处理
function cli(e) {
    const id = e.target.id;
    if (id === "popupLang0" || id === "popupLang1" || id === "t" || id === "c") {
        return;
    }
    window.keep = 0;
    window.hideAlign(e);
}

// 搜索功能
async function search(form) {
    // 清除文本内容缓存
    window.alibuf = new Array(7058);
    
    const formData = new FormData(form);
    const tableSelect = $('#table-select');
    
    const searchData = {
        table_name: tableSelect.value,
        pos0: formData.get('pos0') || '',
        neg0: formData.get('neg0') || '',
        pos1: formData.get('pos1') || '',
        neg1: formData.get('neg1') || ''
    };
    
    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Search error:', error);
        alert('搜索出错：' + error.message);
    }
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
                <td class="aliresultbox" title="总区块数" style="background-color: #eee;">
                    Total blocks: ${totalBlocks}
                </td>
                <td class="aliresultbox" title="双向匹配的区块数" style="background-color: #2196F3; color: white;">
                    Matches: ${stats.both_matches || 0}
                </td>
                <td class="aliresultbox" title="左侧匹配数" style="background-color: #9C27B0; color: white;">
                    Left matches: ${stats.left_matches || 0}
                </td>
                <td class="aliresultbox" title="右侧匹配数" style="background-color: #E91E63; color: white;">
                    Right matches: ${stats.right_matches || 0}
                </td>
                <td class="aliresultbox" title="正向匹配数" style="background-color: #4CAF50; color: white;">
                    Positive matches: ${stats.positive_matches || 0}
                </td>
                <td class="aliresultbox" title="负向匹配数" style="background-color: #ff9800; color: white;">
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

function getMatchClass(item) {
    if (!item || !item.match_type || item.match_type.length === 0) {
        return '';  // 返回空字符串，使用默认的灰色背景
    }
    
    const types = item.match_type;
    
    // 优先级顺序：negative > both > positive > left/right
    if (types.includes('negative')) {
        return 'alisqn';  // 负向匹配（橙色）
    }
    if (types.includes('both')) {
        return 'alisqm';  // 完全匹配（蓝色）
    }
    if (types.includes('positive')) {
        return 'alisqp';  // 正向匹配（绿色）
    }
    if (types.includes('left')) {
        return 'alisql';  // 左侧匹配（紫色）
    }
    if (types.includes('right')) {
        return 'alisqr';  // 右侧匹配（粉色）
    }
    
    return '';  // 默认灰色
}

// 加载所有表格
async function loadTables() {
    const response = await fetch('/tables');
    const data = await response.json();
    const select = $('#table-select');
    
    select.innerHTML = data.tables.map(table => 
        `<option value="${table}">${table}</option>`
    ).join('');
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    
    // 上传对话框控制
    const uploadDialog = $('#upload-dialog');
    const showUploadBtn = $('#show-upload-btn');
    const closeBtn = $('.close-btn');
    
    // 显示上传对话框
    showUploadBtn.addEventListener('click', () => {
        uploadDialog.style.display = 'block';
    });
    
    // 关上传对话框
    closeBtn.addEventListener('click', () => {
        uploadDialog.style.display = 'none';
    });
    
    // 点击对话框外部关闭
    uploadDialog.addEventListener('click', (e) => {
        if (e.target === uploadDialog) {
            uploadDialog.style.display = 'none';
        }
    });
    
    // 处理文件上传
    const uploadForm = $('#upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('上传成功！');
                    uploadDialog.style.display = 'none';
                    loadTables();  // 重新加载表格列表
                } else {
                    alert(data.error || '上传失败');
                }
            } catch (error) {
                alert('上传出错：' + error.message);
            }
        });
    }
    
    // 表格选择
    const tableSelect = $('#table-select');
    if (tableSelect) {
        tableSelect.addEventListener('change', (e) => {
            // 切换表格时清除缓存
            window.alibuf = new Array(7058);
            
            // 如果当前有搜索结果，重新执行搜索
            const searchForm = $('#search-form');
            if (searchForm) {
                search(searchForm);
            }
        });
    }
});

// 添加展开/收起功能
function ouvre(n,h) {
    const row = document.getElementById('idRow' + n);
    if (row.style.display == 'none') {
        row.style.display = '';
        row.style.height = h + 'px';
    } else {
        row.style.display = 'none';
    }
}

function dessus(n) {
    const name = document.getElementById('name' + n);
    if (name) {
        name.style.backgroundColor = '#eee';
    }
}

function parti(n) {
    const name = document.getElementById('name' + n);
    if (name) {
        name.style.backgroundColor = '';
    }
}

