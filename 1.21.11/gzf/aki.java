public enum aki {
   a,
   b,
   c;

   private static final int d = 1;
   private static final int e = 2;
   private static final int f = 3;

   public static aki a(int $$0) {
      aki var10000;
      switch($$0) {
      case 1:
         var10000 = a;
         break;
      case 2:
         var10000 = b;
         break;
      case 3:
         var10000 = c;
         break;
      default:
         throw new IllegalArgumentException("Unknown connection intent: " + $$0);
      }

      return var10000;
   }

   public int a() {
      byte var10000;
      switch(this.ordinal()) {
      case 0:
         var10000 = 1;
         break;
      case 1:
         var10000 = 2;
         break;
      case 2:
         var10000 = 3;
         break;
      default:
         throw new MatchException((String)null, (Throwable)null);
      }

      return var10000;
   }

   // $FF: synthetic method
   private static aki[] b() {
      return new aki[]{a, b, c};
   }
}
