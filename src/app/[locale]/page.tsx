'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faUpload, faFlag, faSearch, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faJs } from '@fortawesome/free-brands-svg-icons'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import HelpAccordion from '@/components/HelpAccordion'
import Popup from '@/components/Popup'
import { Toaster, toast } from 'react-hot-toast'
import {
  SearchResult,
  SearchParams,
  SearchStats,
  getBlockMatchTypes,
  calculateSearchStats,
  getBlockClass,
  debugBlock
} from '@/lib/search'

export default function Home() {
  const t = useTranslations()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchStats, setSearchStats] = useState<SearchStats>({
    total_blocks: 0,
    total_volumes: 0,
    total_matches: 0,
    left_matches: 0,
    right_matches: 0,
    positive_matches: 0,
    negative_matches: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [volumesPerPage, setVolumesPerPage] = useState(4)
  const [selectedBlock, setSelectedBlock] = useState<SearchResult | null>(null)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [isPopupFixed, setIsPopupFixed] = useState(false)
  const [totalVolumes, setTotalVolumes] = useState(0)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    pos0: '',
    neg0: '',
    pos1: '',
    neg1: ''
  })
  
  // 卷的分界点
  const volumes = [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266]
  
  // 获取卷的范围
  const getVolumeRange = (volumeIndex: number) => {
    const start = volumeIndex === 0 ? 1 : volumes[volumeIndex - 1] + 1
    const end = volumes[volumeIndex]
    return { start, end }
  }

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pos0: searchParams.pos0,
          neg0: searchParams.neg0,
          pos1: searchParams.pos1,
          neg1: searchParams.neg1,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const results = data.results as SearchResult[];
      
      // 计算搜索统计信息
      const stats = calculateSearchStats(results, searchParams);
      setSearchStats(stats);
      setTotalVolumes(stats.total_volumes);
      
      // 为每个结果添加匹配类型
      const processedResults = results.map(result => ({
        ...result,
        match_type: getBlockMatchTypes(result, searchParams)
      }));
      
      setSearchResults(processedResults);
      setCurrentPage(0);
    } catch (error) {
      toast.error(t('search.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(searchStats.total_volumes / volumesPerPage));

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleBlockClick = async (e: React.MouseEvent, result: SearchResult) => {
    // 添加调试信息
    debugBlock(result, searchParams);

    // 如果点击的是同一个方块，则关闭弹窗
    if (isPopupVisible && currentId === result.id) {
      setIsPopupVisible(false)
      setCurrentId(null)
      setIsPopupFixed(false)
      return
    }

    try {
      // 获取当前的搜索条件
      const searchForm = document.getElementById('search-form') as HTMLFormElement
      const formData = new FormData(searchForm)
      const searchParams = new URLSearchParams()
      searchParams.set('pos0', formData.get('pos0') as string || '')
      searchParams.set('neg0', formData.get('neg0') as string || '')
      searchParams.set('pos1', formData.get('pos1') as string || '')
      searchParams.set('neg1', formData.get('neg1') as string || '')

      const response = await fetch(`/api/align/${result.id}?${searchParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch alignment')
      const data = await response.json()
      
      // 使用当前方块的 match_type
      setSelectedBlock({
        ...data,
        match_type: result.match_type
      })
      
      setIsPopupVisible(true)
      setCurrentId(result.id)
      // 如果按住 Ctrl 键点击，则固定弹窗
      setIsPopupFixed(e.ctrlKey)
    } catch (error) {
      toast.error(t('align.error'))
    }
  }

  // 点击页面其他地方关闭弹窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!isPopupFixed && !target.closest('#popupLang0, #popupLang1, #t, #c, .alisq')) {
        setIsPopupVisible(false)
        setCurrentId(null)
        setIsPopupFixed(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isPopupFixed])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 先获取并更新搜索参数
    const formData = new FormData(e.currentTarget);
    const newSearchParams = {
      pos0: formData.get('pos0') as string || '',
      neg0: formData.get('neg0') as string || '',
      pos1: formData.get('pos1') as string || '',
      neg1: formData.get('neg1') as string || ''
    };

    // 检查是否有任何搜索条件
    if (!newSearchParams.pos0 && !newSearchParams.neg0 && 
        !newSearchParams.pos1 && !newSearchParams.neg1) {
      toast.error(t('search.error.noConditions'));
      return;
    }

    setSearchParams(newSearchParams);
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSearchParams),  // 使用新的搜索参数
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      if (process.env.DEBUG_MODE === 'true') {
        console.log('Search API response:', data);
      }
      
      const results = data.results as SearchResult[];
      if (process.env.DEBUG_MODE === 'true') {
        console.log('Total results:', results.length);
      }
      
      // 使用新的搜索参数计算统计信息
      const stats = calculateSearchStats(results, newSearchParams);
      if (process.env.DEBUG_MODE === 'true') {
        console.log('Calculated stats:', stats);
      }
      
      setSearchStats(stats);
      setTotalVolumes(stats.total_volumes);
      
      // 使用新的搜索参数处理结果
      const processedResults = results.map(result => ({
        ...result,
        match_type: getBlockMatchTypes(result, newSearchParams)
      }));
      if (process.env.DEBUG_MODE === 'true') {
        console.log('Processed results:', processedResults.length);
      }
      
      setSearchResults(processedResults);
      setCurrentPage(0);
    } catch (error) {
      if (process.env.DEBUG_MODE === 'true') {
        console.error('Search error:', error);
      }
      toast.error(t('search.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-container">
      <Toaster />
      {/* 内容区域包装器 */}
      <div className="content-wrapper">
        {/* 主要内容区域 */}
        <div className="main-content">
          {/* 标题区域 */}
          <div className="header-section mb-4">
            <h1 className="display-4 text-primary">
              <FontAwesomeIcon icon={faAlignLeft} /> alignoscope
            </h1>
          </div>

          {/* 控制区域 */}
          <div className="control-section card mb-4">
            <div className="card-body d-flex align-items-center gap-3">
              {/* 左侧按钮和选择器 */}
              <div className="d-flex align-items-center gap-3">
                <button
                  id="show-upload-btn"
                  className="btn btn-primary"
                  title="暂不支持上传"
                  disabled
                >
                  <FontAwesomeIcon icon={faUpload} /> {t('upload')}
                </button>
                <select
                  id="table-select"
                  name="table"
                  className="form-select w-auto"
                  hidden
                >
                  <option value="jeanchristophe">Jean-Christophe</option>
                </select>
              </div>

              {/* 右侧语言切换按钮组 */}
              <LanguageSwitcher />
            </div>
          </div>

          {/* 搜索表单 */}
          <form id="search-form" className="search-section card mb-4" onSubmit={handleFormSubmit}>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>{t('originalTitle')}</h5>
                </div>
                <div className="col-md-6">
                  <h5>{t('translationTitle')}</h5>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">{t('contains')}</label>
                  <input type="text" name="pos0" id="pos0" className="form-control" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('notContains')}</label>
                  <input type="text" name="neg0" id="neg0" className="form-control" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('contains')}</label>
                  <input type="text" name="pos1" id="pos1" className="form-control" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('notContains')}</label>
                  <input type="text" name="neg1" id="neg1" className="form-control" />
                </div>
              </div>

              <div className="text-center mt-3">
                <button type="submit" className="btn btn-primary px-4" disabled={isLoading}>
                  <FontAwesomeIcon icon={faSearch} /> {t('search')}
                </button>
              </div>
            </div>
          </form>

          {/* 结果区域 */}
          <div id="results" className={`results-section mb-4 ${isLoading ? 'loading' : ''}`}>
            {searchResults.length > 0 && (
              <>
                {/* 统计信息 */}
                <div className="stats-container mb-3">
                  <div className="row g-2">
                    <div className="col">
                      <div className="p-2 border rounded text-center" style={{backgroundColor: '#808080', color: 'white'}}>
                        <div className="small">{t('stats.totalBlocks')}</div>
                        <div className="h5 mb-0">{searchStats.total_blocks}</div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-2 border rounded text-center" style={{backgroundColor: '#006400', color: 'white'}}>
                        <div className="small">{t('stats.bothMatches')}</div>
                        <div className="h5 mb-0">{searchStats.total_matches}</div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-2 border rounded text-center" style={{backgroundColor: '#90EE90', color: 'black'}}>
                        <div className="small">{t('stats.leftMatches')}</div>
                        <div className="h5 mb-0">{searchStats.left_matches}</div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-2 border rounded text-center" style={{backgroundColor: '#90EE90', color: 'black'}}>
                        <div className="small">{t('stats.rightMatches')}</div>
                        <div className="h5 mb-0">
                          {searchStats.right_matches === searchStats.total_blocks 
                            ? t('stats.all')
                            : searchStats.right_matches}
                        </div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-2 border rounded text-center">
                        <div className="small text-muted">{t('stats.positiveMatches')}</div>
                        <div className="h5 mb-0">
                          {(!searchParams.pos0 && !searchParams.pos1)
                            ? t('stats.all')
                            : searchStats.positive_matches}
                        </div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-2 border rounded text-center">
                        <div className="small text-muted">{t('stats.negativeMatches')}</div>
                        <div className="h5 mb-0">
                          {(!searchParams.neg0 && !searchParams.neg1)
                            ? t('stats.all')
                            : searchStats.negative_matches}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 分页控件 */}
                <div className="row align-items-center my-3">
                  <div className="col-md-3">
                    <label className="form-label me-2">每页显示卷数：</label>
                    <select 
                      className="volumes-per-page form-select form-select-sm d-inline-block w-auto"
                      value={volumesPerPage}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setVolumesPerPage(newValue);
                        setCurrentPage(0); // 重置到第一页
                      }}
                    >
                      {[2, 4, 6, 8, 10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-9">
                    <div className="pagination-controls d-flex justify-content-end align-items-center">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0 || searchResults.length === 0}
                      >
                        {'<<< 上一页'}
                      </button>
                      <span className="mx-3">
                        {searchResults.length > 0 
                          ? `第 ${currentPage + 1} 页，共 ${totalPages} 页`
                          : '无搜索结果'}
                      </span>
                      <button 
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1 || searchResults.length === 0}
                      >
                        {'下一页 >>>'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 搜索结果网格 */}
                <div className="alisq-grid">
                  <table style={{width: '100%', emptyCells: 'show'}} cellPadding="1" cellSpacing="3">
                    {Array.from({ length: Math.ceil(searchStats.total_volumes / volumesPerPage) }).map((_, pageIndex) => {
                      if (pageIndex !== currentPage) return null;
                      
                      const startVolumeNum = pageIndex * volumesPerPage + 1;
                      const endVolumeNum = Math.min(startVolumeNum + volumesPerPage - 1, searchStats.total_volumes);
                      const pageVolumes = Array.from(
                        { length: endVolumeNum - startVolumeNum + 1 },
                        (_, i) => startVolumeNum + i
                      );
                      
                      return (
                        <tbody key={pageIndex}>
                          {pageVolumes.map(volumeNum => {
                            // 获取当前卷的所有方块
                            const volumeBlocks = searchResults.filter(
                              result => result.volume === volumeNum
                            );

                            return volumeBlocks.length > 0 ? (
                              <tr key={volumeNum}>
                                <td style={{border: '3px solid grey', width: '50%', verticalAlign: 'top'}}>
                                  {volumeBlocks.map(block => (
                                    <div
                                      key={block.id}
                                      className={getBlockClass(block.match_type, 'left')}
                                      onClick={(e) => handleBlockClick(e, block)}
                                      title={block.lang0}
                                    />
                                  ))}
                                </td>
                                <td style={{border: '3px solid grey', width: '50%', verticalAlign: 'top'}}>
                                  {volumeBlocks.map(block => (
                                    <div
                                      key={block.id}
                                      className={getBlockClass(block.match_type, 'right')}
                                      onClick={(e) => handleBlockClick(e, block)}
                                      title={block.lang1}
                                    />
                                  ))}
                                </td>
                              </tr>
                            ) : null;
                          })}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 帮助和说明区域 */}
        <div className="accordion-section">
          <HelpAccordion />
        </div>
      </div>

      {/* 页脚 */}
      <footer className="footer-section card bg-dark text-light">
        <div className="card-body">
          <div className="row align-items-center text-center g-3">
            <div className="col-md-4">
              Idea & Alignment by <a href="https://miaojun.net" className="text-light">Miao Jun</a>
            </div>
            <div className="col-md-4">
              Inspired by <a href="http://www.cavi.univ-paris3.fr/ilpga/ilpga/sfleury/page1.htm" className="text-light">Serge Fleury</a>&apos;s <a href="http://tal.univ-paris3.fr/mkAlign/" className="text-light">MkAlign</a>
            </div>
            <div className="col-md-4">
              Other Projects : French-Chinese Political Corpus <a href="https://politics.corpusmart.cn/" className="text-light" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faExternalLinkAlt} /></a>
            </div>
          </div>
          <hr className="my-3" />
          <div className="text-center">
            <Image
              src="/images/alignoscope.png"
              alt="Alignoscope"
              width={150}
              height={40}
              className="me-2"
            />
            Originally programmed by <a href="http://gerdes.fr" className="text-light">Kim Gerdes</a>, rewritten by Boyuan SHI in Next.js <FontAwesomeIcon icon={faJs} /> with PostgreSQL <FontAwesomeIcon icon={faDatabase} />
          </div>
        </div>
      </footer>

      {/* 弹出窗口 */}
      {selectedBlock && (
        <Popup
          id={selectedBlock.id}
          lang0={selectedBlock.lang0}
          lang1={selectedBlock.lang1}
          isVisible={isPopupVisible}
          isFixed={isPopupFixed}
          matchType={selectedBlock.match_type}
          onClose={() => {
            setIsPopupVisible(false)
            setCurrentId(null)
            setIsPopupFixed(false)
          }}
        />
      )}
    </div>
  )
}