import { useDispatch, useSelector } from "react-redux";
import { Event } from "../app/emitter";
import useEvent from "../app/use-event";
import {
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
  setMoving,
} from "../state/gameSlice";
import { useEffect, useRef, useState } from "react";
import { selectFrozen, selectSpinning } from "../state/uiSlice";
import { MOVE_SPEED } from "../app/constants";
import { Direction } from "../state/state-types";
import { selectGameSpeed } from "../state/settingsSlice";

const MovementHandler = () => {
  const dispatch = useDispatch();
  const [pressingLeft, setPressingLeft] = useState(false);
  const [pressingRight, setPressingRight] = useState(false);
  const [pressingUp, setPressingUp] = useState(false);
  const [pressingDown, setPressingDown] = useState(false);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const spinning = useSelector(selectSpinning);
  const frozen = useSelector(selectFrozen);
  const gameSpeed = useSelector(selectGameSpeed);

  // Speed-adjusted move speed: faster at higher speeds
  const adjustedMoveSpeed = Math.max(30, Math.round(MOVE_SPEED / gameSpeed));

  const pressingButton =
    pressingLeft || pressingRight || pressingUp || pressingDown;

  useEffect(() => {
    dispatch(setMoving(pressingButton));
  }, [pressingButton, dispatch]);

  const direction = pressingLeft
    ? Direction.Left
    : pressingRight
    ? Direction.Right
    : pressingUp
    ? Direction.Up
    : Direction.Down;

  useEffect(() => {
    const move = (direction: Direction) => {
      switch (spinning ?? direction) {
        case Direction.Down:
          dispatch(moveDown());
          break;
        case Direction.Up:
          dispatch(moveUp());
          break;
        case Direction.Left:
          dispatch(moveLeft());
          break;
        case Direction.Right:
          dispatch(moveRight());
          break;
      }
    };

    if ((pressingButton || spinning) && !cooldown && !frozen) {
      move(direction);
      setCooldown(true);

      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }

      tickIntervalRef.current = setInterval(() => {
        move(direction);
      }, adjustedMoveSpeed);

      setTimeout(() => setCooldown(false), adjustedMoveSpeed);
    } else if (!pressingButton && tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressingButton, direction, dispatch, cooldown, frozen, adjustedMoveSpeed]);

  useEvent(Event.StartDown, () => setPressingDown(true));
  useEvent(Event.StartUp, () => setPressingUp(true));
  useEvent(Event.StartLeft, () => setPressingLeft(true));
  useEvent(Event.StartRight, () => setPressingRight(true));
  useEvent(Event.StopDown, () => setPressingDown(false));
  useEvent(Event.StopUp, () => setPressingUp(false));
  useEvent(Event.StopLeft, () => setPressingLeft(false));
  useEvent(Event.StopRight, () => setPressingRight(false));
  useEvent(Event.StopMoving, () => {
    setPressingLeft(false);
    setPressingRight(false);
    setPressingUp(false);
    setPressingDown(false);
  });

  return null;
};

export default MovementHandler;
