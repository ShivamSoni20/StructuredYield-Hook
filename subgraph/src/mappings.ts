import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  FeesRouted,
  ILCovered,
  PositionClosed,
  PTYTMinted
} from "../../generated/StructuredYieldHook/StructuredYieldHook";
import { FeeRoute, ILCoverage, Position } from "../../generated/schema";

function positionId(poolId: Bytes, lp: Bytes): Bytes {
  return poolId.concat(lp);
}

export function handlePTYTMinted(event: PTYTMinted): void {
  const id = positionId(event.params.poolId, event.params.lp);
  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);
    position.poolId = event.params.poolId;
    position.lp = event.params.lp;
    position.principal = BigInt.zero();
    position.totalFees = BigInt.zero();
    position.ilCovered = BigInt.zero();
    position.openedAt = event.block.timestamp;
  }

  position.ptAmount = event.params.ptAmount;
  position.ytAmount = event.params.ytAmount;
  position.maturity = event.params.maturity;
  position.save();
}

export function handleFeesRouted(event: FeesRouted): void {
  const entity = new FeeRoute(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.poolId = event.params.poolId;
  entity.ytFees = event.params.ytFees;
  entity.insuranceFees = event.params.insuranceFees;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleILCovered(event: ILCovered): void {
  const entity = new ILCoverage(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.poolId = event.params.poolId;
  entity.lp = event.params.lp;
  entity.ilAmount = event.params.ilAmount;
  entity.paidAmount = event.params.paidAmount;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const id = positionId(event.params.poolId, event.params.lp);
  const position = Position.load(id);
  if (position != null) {
    position.ilCovered = position.ilCovered.plus(event.params.paidAmount);
    position.save();
  }
}

export function handlePositionClosed(event: PositionClosed): void {
  const id = positionId(event.params.poolId, event.params.lp);
  const position = Position.load(id);
  if (position == null) return;

  position.principal = event.params.principal;
  position.totalFees = event.params.totalFees;
  position.closedAt = event.block.timestamp;
  position.save();
}

