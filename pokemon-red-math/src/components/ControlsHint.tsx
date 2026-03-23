import styled, { keyframes } from "styled-components";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectGameSpeed } from "../state/settingsSlice";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Bar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 6px 12px;
  z-index: 9999;
  animation: ${fadeIn} 0.4s ease-out;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 8px;
    padding: 5px 6px;
  }
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 600px) {
    gap: 3px;
  }
`;

const Key = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 7px;
  font-family: "PressStart2P", monospace;
  font-size: 9px;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 0 #222;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 6px;
    padding: 2px 4px;
    min-width: 18px;
  }
`;

const Label = styled.span`
  color: #aaa;
  font-family: "PressStart2P", monospace;
  font-size: 8px;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 5px;
  }
`;

const Divider = styled.span`
  color: #444;
  font-size: 12px;
  user-select: none;

  @media (max-width: 600px) {
    display: none;
  }
`;

const SpeedDisplay = styled.span<{ $fast: boolean }>`
  color: ${(p) => (p.$fast ? "#f90" : "#aaa")};
  font-family: "PressStart2P", monospace;
  font-size: 9px;
  font-weight: bold;

  @media (max-width: 600px) {
    font-size: 6px;
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: 1px solid #555;
  border-radius: 4px;
  color: #888;
  font-family: "PressStart2P", monospace;
  font-size: 7px;
  padding: 2px 6px;
  cursor: pointer;
  margin-left: 4px;

  &:hover {
    color: #fff;
    border-color: #999;
  }

  @media (max-width: 600px) {
    font-size: 5px;
    padding: 2px 4px;
  }
`;

const ControlsHint = () => {
  const [visible, setVisible] = useState(true);
  const speed = useSelector(selectGameSpeed);

  if (!visible) return null;

  return (
    <Bar>
      <Group>
        <Key>&#8593;</Key>
        <Key>&#8595;</Key>
        <Key>&#8592;</Key>
        <Key>&#8594;</Key>
        <Label>Move</Label>
      </Group>

      <Divider>|</Divider>

      <Group>
        <Key>ENTER</Key>
        <Label>A</Label>
      </Group>

      <Divider>|</Divider>

      <Group>
        <Key>SHIFT</Key>
        <Label>B</Label>
      </Group>

      <Divider>|</Divider>

      <Group>
        <Key>SPACE</Key>
        <Label>Menu</Label>
      </Group>

      <Divider>|</Divider>

      <Group>
        <Key>1</Key>
        <Label>-</Label>
        <Key>9</Key>
        <Label>Speed</Label>
        <SpeedDisplay $fast={speed > 1}>{speed}x</SpeedDisplay>
      </Group>

      <CloseBtn onClick={() => setVisible(false)}>X</CloseBtn>
    </Bar>
  );
};

export default ControlsHint;
