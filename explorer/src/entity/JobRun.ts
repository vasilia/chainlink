import {
  Column,
  Connection,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { TaskRun } from './TaskRun'
import { ChainlinkNode, IChainlinkNodePresenter } from './ChainlinkNode'

@Entity()
export class JobRun {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  chainlinkNodeId: number

  @Column()
  runId: string

  @Column()
  jobId: string

  @Column()
  status: string

  @Column()
  type: string

  @Column({ nullable: true })
  requestId: string

  @Column({ nullable: true })
  txHash: string

  @Column({ nullable: true })
  requester: string

  @Column({ nullable: true })
  error: string

  @Column()
  createdAt: Date

  @Column({ nullable: true })
  completedAt: Date

  @OneToMany(type => TaskRun, taskRun => taskRun.jobRun, {
    eager: true,
    onDelete: 'CASCADE'
  })
  taskRuns: Array<TaskRun>

  @ManyToOne(type => ChainlinkNode, ChainlinkNode => ChainlinkNode.jobRuns, {
    eager: true
  })
  chainlinkNode: ChainlinkNode
}

export const fromString = (str: string): JobRun => {
  const json = JSON.parse(str)
  const jr = new JobRun()
  jr.runId = json.runId
  jr.jobId = json.jobId
  jr.status = json.status
  jr.createdAt = new Date(json.createdAt)
  jr.completedAt = json.completedAt && new Date(json.completedAt)

  jr.type = json.initiator.type
  jr.requestId = json.initiator.requestId
  jr.txHash = json.initiator.txHash
  jr.requester = json.initiator.requester

  jr.taskRuns = json.tasks.map((trstr: any, index: number) => {
    const tr = new TaskRun()
    tr.index = index
    tr.type = trstr.type
    tr.status = trstr.status
    tr.error = trstr.error

    return tr
  })

  return jr
}

export interface ISearchParams {
  searchQuery?: string
  page?: number
  limit?: number
}

export const search = async (
  db: Connection,
  params: ISearchParams
): Promise<JobRun[]> => {
  let query = db.getRepository(JobRun).createQueryBuilder('job_run')

  if (params.searchQuery != null) {
    const searchTokens = params.searchQuery.split(/\s+/)
    query = query
      .where('job_run.runId IN(:...searchTokens)', { searchTokens })
      .orWhere('job_run.jobId IN(:...searchTokens)', { searchTokens })
      .orWhere('job_run.requester IN(:...searchTokens)', { searchTokens })
      .orWhere('job_run.requestId IN(:...searchTokens)', { searchTokens })
      .orWhere('job_run.txHash IN(:...searchTokens)', { searchTokens })
  }

  if (params.limit != null) {
    query = query.limit(params.limit)
  }

  if (params.page !== undefined) {
    const offset = (params.page - 1) * params.limit
    query = query.offset(offset)
  }

  return query
    .leftJoinAndSelect('job_run.chainlinkNode', 'chainlink_node')
    .orderBy('job_run.createdAt', 'DESC')
    .getMany()
}

type Modify<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R
interface IChainlinkPresenterOverride {
  chainlinkNode: IChainlinkNodePresenter
}
type JobRunPresenter = Modify<JobRun, IChainlinkPresenterOverride>

export const present = (jr: JobRun): JobRunPresenter => {
  return {
    ...jr,
    chainlinkNode: jr.chainlinkNode.present()
  }
}

export const saveJobRunTree = async (db: Connection, jobRun: JobRun) => {
  await db.manager.transaction(async manager => {
    const builder = manager.createQueryBuilder()

    const response = await builder
      .insert()
      .into(JobRun)
      .values(jobRun)
      .onConflict(
        `("runId", "chainlinkNodeId") DO UPDATE SET
        "status" = :status
        ,"error" = :error
        ,"completedAt" = :completedAt
      `
      )
      .setParameter('status', jobRun.status)
      .setParameter('error', jobRun.error)
      .setParameter('completedAt', jobRun.completedAt)
      .execute()

    await Promise.all(
      jobRun.taskRuns.map(tr => {
        // new builder since execute stmnt above seems to mutate.
        const builder = manager.createQueryBuilder()
        tr.jobRun = jobRun
        return builder
          .insert()
          .into(TaskRun)
          .values(tr)
          .onConflict(
            `("index", "jobRunId") DO UPDATE SET
              "status" = :status
              ,"error" = :error
              `
          )
          .setParameter('status', tr.status)
          .setParameter('error', tr.error)
          .execute()
      })
    )
  })
}
