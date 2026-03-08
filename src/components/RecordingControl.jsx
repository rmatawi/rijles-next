import React from 'react';
import { Button } from 'framework7-react';
import { useRecording } from '../contexts/RecordingContext';

const RecordingControl = () => {
  const { isRecordingMode, toggleRecordingMode } = useRecording();

  return (
    <Button
      fill
      bgColor={isRecordingMode ? "red" : "green"}
      iconF7={isRecordingMode ? "stop_fill" : "record_circle"}
      iconSize={20}
      text={isRecordingMode ? "Stop Recording" : "Start Recording"}
      style={{ margin: '10px' }}
      onClick={toggleRecordingMode}
    />
  );
};

export default RecordingControl;