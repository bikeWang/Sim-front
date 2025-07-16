import React from 'react';
import { Popover, Tabs, Space } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import styles from './emojiPicker.module.css';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  // 表情分类
  const emojiCategories = {
    faces: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'
    ],
    gestures: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆'
    ],
    hearts: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤',
      '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞'
    ],
    symbols: [
      '🔥', '✨', '💫', '⭐', '🌟', '💥', '💢', '💦',
      '💨', '🕊️', '💭', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💯'
    ]
  };

  const items = [
    {
      key: 'faces',
      label: '表情',
      children: (
        <div className={styles.emojiGrid}>
          {emojiCategories.faces.map((emoji, index) => (
            <div
              key={index}
              className={styles.emojiItem}
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'gestures',
      label: '手势',
      children: (
        <div className={styles.emojiGrid}>
          {emojiCategories.gestures.map((emoji, index) => (
            <div
              key={index}
              className={styles.emojiItem}
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'hearts',
      label: '心形',
      children: (
        <div className={styles.emojiGrid}>
          {emojiCategories.hearts.map((emoji, index) => (
            <div
              key={index}
              className={styles.emojiItem}
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'symbols',
      label: '符号',
      children: (
        <div className={styles.emojiGrid}>
          {emojiCategories.symbols.map((emoji, index) => (
            <div
              key={index}
              className={styles.emojiItem}
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>
      )
    }
  ];

  const content = (
    <div className={styles.emojiPicker}>
      <Tabs
        items={items}
        tabBarGutter={16}
        className={styles.emojiTabs}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="topLeft"
      overlayClassName={styles.emojiPopover}
    >
      <SmileOutlined className={styles.emojiButton} />
    </Popover>
  );
};

export default EmojiPicker;