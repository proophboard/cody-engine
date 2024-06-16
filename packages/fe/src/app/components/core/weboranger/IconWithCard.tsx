import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from '@mui/material';

interface IconWithCardProps {
  cardContent: string;
  showOnTop: boolean;
}

const IconWithCard: React.FC<IconWithCardProps> = ({ cardContent, showOnTop }) => {
  const [isCardVisible, setCardVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const verticalPosition = showOnTop ? '-140px' : '20px';

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
    <Box sx={{ position: 'relative', bottom:'9px', left:'4px'}}>
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
            top: verticalPosition, //Hier änder das Card nicht umtem am bildschirm verschwindet
            left: '0',
            backgroundColor: '#fff',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            padding: '10px 10px 10px 10px',  // Add padding to ensure content is not overlapped
            zIndex: 1000,
            width: '250px'  // Ensure the card has a fixed width
          }}
        >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <Typography variant="h6" style={{fontWeight:'bold'}}>Info</Typography>
          <Button onClick={closeCard} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>×</Button>
        </Box>
        <Typography>{cardContent}</Typography>
        </Box>
      )}


    </Box>
  );
};

export default IconWithCard;
