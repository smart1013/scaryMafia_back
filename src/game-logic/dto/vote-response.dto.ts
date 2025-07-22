export class VoteResponseDto {
  success: boolean;
  message: string;
  voteCount?: number;
  allVotesComplete?: boolean;
} 