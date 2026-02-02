import java.util.List;
import org.jspecify.annotations.Nullable;

public record afb(int b, List<dgs.a> c) implements aay<adb> {
   public static final aao<wx, afb> a;

   public afb(int param1, List<dgs.a> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<afb> a() {
      return ahz.Y;
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

   public List<dgs.a> e() {
      return this.c;
   }

   static {
      a = aao.a(aam.h, afb::b, dgs.a.a.a(aam.a()), afb::e, afb::new);
   }
}
