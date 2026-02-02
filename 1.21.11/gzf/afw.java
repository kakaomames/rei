import org.jspecify.annotations.Nullable;

public record afw(int b, jd<cfk> c) implements aay<adb> {
   public static final aao<xq, afw> a;

   public afw(int param1, jd<cfk> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<afw> a() {
      return ahz.at;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   @Nullable
   public cgk a(dwo $$0) {
      return $$0.a(this.b);
   }

   public int b() {
      return this.b;
   }

   public jd<cfk> e() {
      return this.c;
   }

   static {
      a = aao.a(aam.h, afw::b, cfk.b, afw::e, afw::new);
   }
}
