import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from '@mui/material';

interface IconWithCardProps {
  cardContent: string;
}

const IconWithCard: React.FC<IconWithCardProps> = ({ cardContent }) => {
  const [isCardVisible, setCardVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const toggleCardVisibility = () => {
    setCardVisible(!isCardVisible);
  };

  const closeCard = () => {
    setCardVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setCardVisible(false);
    };

    if (isCardVisible) {
      window.addEventListener('scroll', handleScroll);
    } else {
      window.removeEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isCardVisible]);

  return (
    <Box sx={{ position: 'relative'}}>
      <Typography
        ref={iconRef}
        sx={{
          cursor: 'pointer',
          fontSize: '1.5em',
          verticalAlign: 'middle'
        }}
        onClick={toggleCardVisibility}
      >
        ℹ️
      </Typography>
      {isCardVisible && (
        <Box
          ref={cardRef}
          sx={{
            position: 'absolute',
            top: '20px',
            left: '0',
            backgroundColor: '#fff',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            padding: '10px',
            zIndex: 1000,
            width: '200px'  // Ensure the card has a fixed width
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{cardContent}</Typography>
            <Button onClick={closeCard} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>×</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default IconWithCard;
