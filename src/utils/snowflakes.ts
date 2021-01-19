import { assert } from 'console';

/**
 * How many bits the worker ID takes up
 */
const workerIdBits = BigInt(5);

/**
 * How many bits the datacenter ID takes up
 */
const datacenterIdBits = BigInt(5);

/**
 * How many bits the sequence takes up
 */
const sequenceBits = BigInt(12);

/**
 * How many bits the timestamp takes up
 */
// const timestamp_bits = BigInt(
//   BigInt(64) - BigInt(1) - sequenceBits - workerIdBits - datacenterIdBits,
// );

/**
 * The Max Number for the Worker IDs
 */
const maxWorkerId = BigInt(BigInt(-1) ^ (BigInt(-1) << workerIdBits));

/**
 * The Max Number for the Datacenter IDs
 */
const maxDatacenterId = BigInt(
  BigInt(-1) ^ (BigInt(-1) << datacenterIdBits),
);

/**
 * How many bits to shift the worker to the left
 */
const workerIdShift = BigInt(sequenceBits);

/**
 * How many bits to shift the datacetner id to the left
 */
// const data_center_shift = BigInt(sequenceBits + workerIdBits);

/**
 * How many bits to shift the timestamp to the left
 */
const timestampLeftShift = BigInt(
  sequenceBits + workerIdBits + datacenterIdBits,
);

/**
 * Max Sequence number
 */
const sequenceMask = BigInt(BigInt(-1) ^ (BigInt(-1) << sequenceBits));

/**
 * 0b1111111111111111111111111111111111111111110000000000000000000000
 */

// const timestampBin = BigInt('18446744073705357312');

/**
 * 0b0000000000000000000000000000000000000000000111110000000000000000
 */
const datacenterBinary = BigInt(2031616);

/**
 * 0b0000000000000000000000000000000000000000000000001111100000000000
 */
const workerBinary = BigInt(63488);

/**
 *  0b0000000000000000000000000000000000000000000000000000111111111111
 */
const sequenceBinary = BigInt(4095);

/**
 * The EPOCH Since the time that this app was firstly developed
 */
export const EPOCH = BigInt(1601074153000);

/**
 * Decodes the Snowflake.
 *
 * @returns { timestamp: null, datacenter: null, worker: null, sequence: null } if an invalid snowflake is passed in
 *
 * @returns { timestamp, datacenter, worker, sequence }
 *
 * @param snowflake The Snowflake
 */
export const decodeSnowflake = (snowflake: string | bigint) => {
  /**
   * Convert the Snowflake into a BigInt
   */
  snowflake =
    typeof snowflake === 'string'
      ? isNaN(Number(snowflake))
        ? null
        : BigInt(snowflake)
      : snowflake;

  if (!snowflake)
    return {
      timestamp: null,
      datacenter: null,
      worker: null,
      sequence: null,
    };

  return {
    timestamp: Number(
      (snowflake >> (sequenceBits + workerIdBits + datacenterIdBits)) +
        EPOCH,
    ),
    datacenter: Number(
      (snowflake & datacenterBinary) >> (sequenceBits + workerIdBits),
    ),
    worker: Number((snowflake & workerBinary) >> sequenceBits),
    sequence: Number(snowflake & sequenceBinary),
  };
};

/**
 * Sleep for X amount of milliseconds
 *
 * @param ms The amount of milliseconds to sleep for
 */
const sleep = (ms: BigInt | number) => {
  ms = typeof ms === 'bigint' ? Number(ms) : ms;

  const now = Date.now();
  while (Date.now() < now + (ms as number));
  return;
};

/**
 * 
 */
export class SnowflakeGenerator {
  public static readonly decode = decodeSnowflake;
  private static generators: Map<BigInt, SnowflakeGenerator> = new Map();

  public static for(
    datacenterId = Number(process.env.DATACENTER_ID || 0),
    workerId = Number(process.env.WORKER_ID || 0),
  ) {
    if (this.generators.has(BigInt(datacenterId) + BigInt(workerId))) {
      return this.generators.get(BigInt(datacenterId) + BigInt(workerId));
    }

    return new SnowflakeGenerator(datacenterId, workerId);
  }

  private lastTimestamp = BigInt(-1);
  private sequence = BigInt(0);

  private workerIdLong = BigInt(this.workerId) << workerIdShift;
  private datacenterIdLong = BigInt(this.datacenterId) << datacenterIdBits;

  
  private constructor(private datacenterId: number, private workerId: number) {
    if (workerId < 0 || workerId > maxWorkerId) {
      assert(workerId >= 0 && workerId <= maxWorkerId);
    }
    if (datacenterId < 0 || datacenterId > maxDatacenterId) {
      assert(datacenterId >= 0 && datacenterId <= maxDatacenterId);
    }

    SnowflakeGenerator.generators.set(
      BigInt(datacenterId) + BigInt(workerId),
      this,
    );
  }

  public encode(timestamp: number): bigint {
    return BigInt(
      ((BigInt(timestamp) - EPOCH) << timestampLeftShift) |
        this.datacenterIdLong |
        this.workerIdLong |
        this.sequence,
    );
  }

  public next(): bigint {
    const timestamp = BigInt(Date.now());

    if (this.lastTimestamp > timestamp) {
      sleep(this.lastTimestamp - timestamp);
      return this.next();
    }

    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + BigInt(1)) & sequenceMask;
      if (this.sequence === BigInt(0)) {
        this.sequence = BigInt(-1) & sequenceMask;
        sleep(1);
        return this.next();
      }
    } else {
      this.sequence = BigInt(0);
    }

    this.lastTimestamp = timestamp;

    return BigInt(
      ((timestamp - EPOCH) << timestampLeftShift) |
        this.datacenterIdLong |
        this.workerIdLong |
        this.sequence,
    );
  }
}

export const Snowflakes = SnowflakeGenerator.for(
  Math.min(process.ppid, 2 ** 5 - 1),
  Math.min(process.pid, 2 ** 5 - 1),
);
