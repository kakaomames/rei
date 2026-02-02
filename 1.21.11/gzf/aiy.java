import aiy.1;
import java.util.function.Function;
import org.jspecify.annotations.Nullable;

public class aiy implements aay<aib> {
   public static final aao<wx, aiy> a = aay.a(aiy::a, aiy::new);
   private final int b;
   private final aiy.a c;
   private final boolean d;
   static final aiy.a e = new 1();

   private aiy(int $$0, boolean $$1, aiy.a $$2) {
      this.b = $$0;
      this.c = $$2;
      this.d = $$1;
   }

   public static aiy a(cgk $$0, boolean $$1) {
      return new aiy($$0.aA(), $$1, e);
   }

   public static aiy a(cgk $$0, boolean $$1, cdb $$2) {
      return new aiy($$0.aA(), $$1, new aiy.d($$2));
   }

   public static aiy a(cgk $$0, boolean $$1, cdb $$2, ftm $$3) {
      return new aiy($$0.aA(), $$1, new aiy.e($$2, $$3));
   }

   private aiy(wx $$0) {
      this.b = $$0.l();
      aiy.b $$1 = (aiy.b)$$0.b(aiy.b.class);
      this.c = (aiy.a)$$1.d.apply($$0);
      this.d = $$0.readBoolean();
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.a((Enum)this.c.a());
      this.c.a($$0);
      $$0.a(this.d);
   }

   public aba<aiy> a() {
      return ahz.bM;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   @Nullable
   public cgk a(axf $$0) {
      return $$0.b(this.b);
   }

   public boolean b() {
      return this.d;
   }

   public boolean a(axg $$0, fth $$1, double $$2) {
      return this.c.a() == aiy.b.b ? $$0.b($$1, $$2) : $$0.a($$1, $$2);
   }

   public void a(aiy.c $$0) {
      this.c.a($$0);
   }

   interface a {
      aiy.b a();

      void a(aiy.c var1);

      void a(wx var1);
   }

   private static class d implements aiy.a {
      private final cdb a;

      d(cdb $$0) {
         this.a = $$0;
      }

      private d(wx $$0) {
         this.a = (cdb)$$0.b(cdb.class);
      }

      public aiy.b a() {
         return aiy.b.a;
      }

      public void a(aiy.c $$0) {
         $$0.a(this.a);
      }

      public void a(wx $$0) {
         $$0.a((Enum)this.a);
      }
   }

   private static class e implements aiy.a {
      private final cdb a;
      private final ftm b;

      e(cdb $$0, ftm $$1) {
         this.a = $$0;
         this.b = $$1;
      }

      private e(wx $$0) {
         this.b = new ftm((double)$$0.readFloat(), (double)$$0.readFloat(), (double)$$0.readFloat());
         this.a = (cdb)$$0.b(cdb.class);
      }

      public aiy.b a() {
         return aiy.b.c;
      }

      public void a(aiy.c $$0) {
         $$0.a(this.a, this.b);
      }

      public void a(wx $$0) {
         $$0.a((float)this.b.g);
         $$0.a((float)this.b.h);
         $$0.a((float)this.b.i);
         $$0.a((Enum)this.a);
      }
   }

   private static enum b {
      a(aiy.d::new),
      b(($$0) -> {
         return aiy.e;
      }),
      c(aiy.e::new);

      final Function<wx, aiy.a> d;

      private b(final Function<wx, aiy.a> param3) {
         this.d = $$0;
      }

      // $FF: synthetic method
      private static aiy.b[] a() {
         return new aiy.b[]{a, b, c};
      }
   }

   public interface c {
      void a(cdb var1);

      void a(cdb var1, ftm var2);

      void a();
   }
}
