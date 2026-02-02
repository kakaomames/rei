import com.google.common.annotations.VisibleForTesting;

public class akg {
   private static final double a = 4096.0D;
   private ftm b;

   public akg() {
      this.b = ftm.c;
   }

   @VisibleForTesting
   static long a(double $$0) {
      return Math.round($$0 * 4096.0D);
   }

   @VisibleForTesting
   static double a(long $$0) {
      return (double)$$0 / 4096.0D;
   }

   public ftm a(long $$0, long $$1, long $$2) {
      if ($$0 == 0L && $$1 == 0L && $$2 == 0L) {
         return this.b;
      } else {
         double $$3 = $$0 == 0L ? this.b.g : a(a(this.b.g) + $$0);
         double $$4 = $$1 == 0L ? this.b.h : a(a(this.b.h) + $$1);
         double $$5 = $$2 == 0L ? this.b.i : a(a(this.b.i) + $$2);
         return new ftm($$3, $$4, $$5);
      }
   }

   public long a(ftm $$0) {
      return a($$0.g) - a(this.b.g);
   }

   public long b(ftm $$0) {
      return a($$0.h) - a(this.b.h);
   }

   public long c(ftm $$0) {
      return a($$0.i) - a(this.b.i);
   }

   public ftm d(ftm $$0) {
      return $$0.d(this.b);
   }

   public void e(ftm $$0) {
      this.b = $$0;
   }

   public ftm a() {
      return this.b;
   }
}
