interface PopupProps {
  id: number;
  lang0: string;
  lang1: string;
  isVisible: boolean;
  isFixed: boolean;
  matchType?: string[];
  onClose: () => void;
}

export default function Popup({ id, lang0, lang1, isVisible, isFixed, matchType = [], onClose }: PopupProps) {
  // 检查内容是否为空或只包含元数据
  const isEmptyOrMeta = (text: string) => {
    if (!text) return true;
    const metaPattern = /^<[^>]+>$/;
    return metaPattern.test(text.trim());
  };

  // 根据匹配类型确定边框颜色类名
  const getBorderClass = () => {
    // 如果有负向匹配，显示红色
    if (matchType.includes('negative_left') || matchType.includes('negative_right')) {
      return 'border-negative';  // 红色：被排除词匹配
    }
    // 如果有正向匹配（left 或 right）且没有负向匹配，显示蓝色
    else if ((matchType.includes('positive_left') || matchType.includes('positive_right')) &&
             !matchType.includes('negative_left') && !matchType.includes('negative_right')) {
      return 'border-positive';  // 蓝色：被搜索词匹配
    }
    // 如果没有任何匹配或有负向匹配，显示黑色
    return 'border-none';  // 黑色：无匹配或被排除
  };

  return (
    <div 
      className={`popup ${isFixed ? 'popup-fixed' : ''} ${getBorderClass()}`}
      style={{ 
        visibility: isVisible ? 'visible' : 'hidden',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="popup-header">
        <span className="popup-title">¶ N°{id}</span>
        <span className="popup-close" onClick={onClose}>&times;</span>
      </div>
      <div className="popup-body">
        <div className="popup-column">
          {isEmptyOrMeta(lang0) 
            ? <em className="text-muted">（无原文，此处为译者注）</em>
            : <div dangerouslySetInnerHTML={{ __html: lang0 }} />
          }
        </div>
        <div className="popup-column">
          {isEmptyOrMeta(lang1)
            ? <em className="text-muted">（无译文）</em>
            : <div dangerouslySetInnerHTML={{ __html: lang1 }} />
          }
        </div>
      </div>
    </div>
  );
} 